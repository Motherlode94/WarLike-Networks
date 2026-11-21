export function numberFor(id){if(!Number.isSafeInteger(id)||id<1||id>99999999)throw new RangeError('Invalid line id');return 'WL-'+String(700000000+id);}
export function parseNumber(number){if(typeof number!=='string'||!/^WL-7[0-9]{8}$/.test(number))return null;const id=Number(number.slice(3))-700000000;return id>0?id:null;}
