type WithDepartments = {
  departments?: string[];
};

type WithSpecializations = {
  specializations?: string[];
};

const firstNonEmpty = (values?: string[]) => values?.find((value) => value.trim().length > 0);

const joinNonEmpty = (values?: string[]) => values?.filter((value) => value.trim().length > 0).join(', ');

export const getPrimaryDepartment = (entity: WithDepartments | null | undefined, fallback = 'General Medicine') =>
  firstNonEmpty(entity?.departments) || fallback;

export const getDepartmentLabel = (entity: WithDepartments | null | undefined, fallback = 'General Medicine') =>
  joinNonEmpty(entity?.departments) || fallback;

export const hasDepartment = (entity: WithDepartments | null | undefined, department: string) =>
  entity?.departments?.some((value) => value.toLowerCase() === department.toLowerCase()) ?? false;

export const getPrimarySpecialization = (
  entity: WithSpecializations | null | undefined,
  fallback = 'General Practice',
) => firstNonEmpty(entity?.specializations) || fallback;

export const getSpecializationLabel = (
  entity: WithSpecializations | null | undefined,
  fallback = 'General Practice',
) => joinNonEmpty(entity?.specializations) || fallback;
