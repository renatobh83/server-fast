import Module from "../../models/Module";

/**
 * Busca módulos ativos.
 */
export async function getActiveModules(): Promise<string[]> {
  const modules = await Module.findAll({
    where: { is_active: true },
    attributes: ["name"],
  });
  return modules.map((m: { name: any }) => m.name);
}

/**
 * Busca status de um módulo pelo nome.
 */
export async function getModuleStatusByName(
  moduleName: string
): Promise<boolean | null> {
  const module = await Module.findOne({
    where: { name: moduleName },
    attributes: ["is_active"],
  });
  return module ? module.is_active : null;
}

/**
 * Lista todos os módulos (ativos e inativos).
 */
export async function getAllModules(): Promise<
  { name: string; is_active: boolean }[]
> {
  const modules = await Module.findAll({
    attributes: ["name", "is_active"],
    order: [["name", "ASC"]],
  });
  return modules.map((m: { name: any; is_active: any }) => ({
    name: m.name,
    is_active: m.is_active,
  }));
}

/**
 * Atualiza o status de um módulo.
 */
export async function updateModuleStatus(
  moduleName: string,
  isActive: boolean
): Promise<number> {
  const [rowsUpdated] = await Module.update(
    { is_active: isActive },
    { where: { name: moduleName } }
  );
  return rowsUpdated;
}
