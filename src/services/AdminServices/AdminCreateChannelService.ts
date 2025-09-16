interface CreateChannelServiceProps {
   name: string;
	status?: string;
	isDefault?: boolean;
	tenantId: number;
}
const AdminCreateChannelService  = async ({
    name,
	status = "OPENING",
	isDefault = false,
	tenantId,
}: CreateChannelServiceProps)=>{

}