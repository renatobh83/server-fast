import { QueryTypes } from "sequelize";
import Contact from "../../models/Contact";
import { AppError } from "../../errors/errors.helper";
import Empresa from "../../models/Empresa";
import User from "../../models/User";
import { sequelize } from "../../database/db";

interface Request {
  searchParam?: string;
  pageNumber?: string;
  tenantId: string | number;
  profile: string;
  userId: string | number;
}

interface Response {
  contacts: Contact[];
  count: number;
  hasMore: boolean;
}

const ListContactsService = async ({
  searchParam = "",
  pageNumber = "1",
  tenantId,
  profile,
  userId,
}: Request): Promise<Response> => {
  try {
    const limit = 40;
    const offset = limit * (+pageNumber - 1);

    const where = `
    "Contact"."tenantId" = ${tenantId}
    and (LOWER("Contact"."name") like '%${searchParam.toLowerCase().trim()}%'
        or "Contact"."number" like '%${searchParam.toLowerCase().trim()}%')
    and (('${profile}' = 'admin') or (("cw"."walletId" = ${userId}) or ("cw"."walletId" is null)))
  `;

    const queryCount = `
    select count(*)
    from "Contacts" as "Contact"
    left join "ContactWallets" cw on cw."contactId" = "Contact".id
    LEFT OUTER JOIN ( "EmpresaContacts" AS "contacts->EmpresaContact"
    INNER JOIN "Empresas" AS "empresas" ON "empresas"."id" = "contacts->EmpresaContact"."contactId")
    ON "Contact"."id" = "contacts->EmpresaContact"."contactId"
    where ${where}
  `;

    const contacts = await Contact.findAll({
      include: [
        {
          model: Empresa,
          as: "empresa",
          through: { attributes: [] }, // Exclui campos da tabela intermediária
          attributes: ["id", "name"], // Inclui apenas os campos desejados de Empresa
        },
        {
          model: User,
          attributes: ["id", "name"],
        },
      ],
      // where: someWhereCondition, // Substitua pela sua condição
      order: [["name", "ASC"]],
      limit: limit,
      offset: offset,
    });

    const data: any = await sequelize.query(queryCount, {
      type: QueryTypes.SELECT,
    });

    const count = data?.[0]?.count || 0;
    const hasMore = count > offset + contacts.length;

    return {
      contacts,
      count,
      hasMore,
    };
  } catch (err: any) {
    console.log(err);
    throw new AppError("ERR_LIST_CONTACT", 502);
  }
};

export default ListContactsService;
