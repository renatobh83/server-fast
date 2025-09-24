import { endOfDay, parseISO, startOfDay } from "date-fns";
import { type Filterable, Op } from "sequelize";
import Contact from "../../models/Contact";
import Ticket from "../../models/Ticket";
import User from "../../models/User";

interface Request {
	dateStart: string;
	dateEnd: string;
	status?: string[];
	userId: string;
	queuesIds?: string[];
	tenantId: string | number;
	showAll?: string | boolean;
}

const TicketsQueuesService = async ({
	dateStart,
	dateEnd,
	status,
	userId,
	queuesIds,
	tenantId,
	showAll,
}: Request): Promise<Ticket[]> => {
	const user = await User.findByPk(userId, { attributes: ["profile"] });

	// Verifica se é admin
	const isAdmin = user?.profile === "admin";
	let whereCondition: Filterable["where"] = {
		// [Op.or]: [{ userId }, { status: "pending" }]
	};
	const includeCondition = [
		{
			model: Contact,
			as: "contact",
			attributes: ["id", "name", "number", "profilePicUrl"],
		},
		{
			association: "whatsapp",
			attributes: ["id", "name"],
		},
		{
			model: User,
			as: "user",
			attributes: ["id", "name", "profile"],
		},
	];
	// Se não for admin e não estiver mostrando tudo, filtra por userId
	if (!isAdmin && showAll !== "true") {
		whereCondition = {
			...whereCondition,
			[Op.or]: [
				{ userId }
			]
		};
	}


	if (showAll === "true") {
		whereCondition = {
			...whereCondition,
			tenantId
		};
	}

	if (status) {
		whereCondition = {
			...whereCondition,
			status,
		};
	} else {
		status = ["open", "pending"];
		// throw new AppError("ERR_NO_STATUS_SELECTED", 404);
	}

	if (dateStart && dateEnd) {
		whereCondition = {
			...whereCondition,
			createdAt: {
				[Op.between]: [
					+startOfDay(parseISO(dateStart)),
					+endOfDay(parseISO(dateEnd)),
				],
			},
		};
	}



	const tickets = await Ticket.findAll({
		where: {
			...whereCondition,
			tenantId,
		},
		include: includeCondition,
		order: [["updatedAt", "DESC"]],
		logging: false
	});

	return tickets;
};

export default TicketsQueuesService;
