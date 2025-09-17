import Empresa from "../../../../models/Empresa"
import EmpresaContact from "../../../../models/EmpresaContact"

export const ContatoEmpresaFlow = async (contact: any): Promise<Empresa[]> => {
    const contatoEmpresa = await Empresa.findAll({
        include: [{
            model: EmpresaContact,
            as: 'empresaContacts',
            where: {
                contactId: contact.id
            },
            attributes: []
        }],
        attributes: ['id', 'name'],
        where: {
            active: true
        },
        raw: true
    })
    
    return contatoEmpresa
}