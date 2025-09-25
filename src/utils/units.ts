export const getUnitAbbreviation = (unit: string): string => {
  const unitMap: Record<string, string> = {
    'pieces': 'pcs',
    'liters': 'L',
    'milliliters': 'mL',
    'kilograms': 'kg',
    'grams': 'g',
    'meters': 'm',
    'centimeters': 'cm',
  };
  
  return unitMap[unit] || unit;
};

export const getUnitDisplay = (unit: string): string => {
  const unitDisplayMap: Record<string, string> = {
    'pieces': 'Pieces',
    'liters': 'Liters',
    'milliliters': 'Milliliters',
    'kilograms': 'Kilograms',
    'grams': 'Grams',
    'meters': 'Meters',
    'centimeters': 'Centimeters',
  };
  
  return unitDisplayMap[unit] || unit;
};

export const formatQuantityWithUnit = (quantity: number, unit: string): string => {
  return `${quantity} ${getUnitAbbreviation(unit)}`;
};

