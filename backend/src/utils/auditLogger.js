import prisma from "../config/prisma.js";

export const createAuditLog = async({
    userId = null,
    siteId = null,
    action,
    entityType,
    entityId = null,
    description = null,
    metadata = null,
    db= prisma
}) =>{
    try{
        return await db.auditLog.create({
            data:{
                userId ,
                siteId,
                action,
                entityType,
                entityId : entityId ? String(entityId) : null,
                description,
                metadata
            }
        });
    }

    catch(error){
        console.error("Audit log error :" , error);

        return null;
    }
}