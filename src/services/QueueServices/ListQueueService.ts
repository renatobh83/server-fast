import Queue from "../../models/Queue";

interface Request {
	tenantId: number;
}
const ListQueueService = async ({ tenantId }: Request): Promise<Queue[]> => {
	const queueData = await Queue.findAll({
		where: {
			tenantId,
		},
		order: [["queue", "ASC"]],
	});

	return queueData;
};

export default ListQueueService;
