const sra = require('sra');
const isAfter = require('date-fns/is_after')

/**
 * Takes data from the death notification and returns their spousal status
 * @param {object} data
 */
const isCallerSpouse = (data => data['is-caller-spouse'] === 'true');

/**
 * Takes data from the death notification and calculates if they are working age
 * @param {object} data
 */
const isWorkingAge = data => {
  const date = new Date(`${data['caller-dob-year']}-${data['caller-dob-month']}-${data['caller-dob-day']}`);
  if (!isNaN(date.getTime())) {
    const statePensionAge = sra(date, data['caller-sex']);
    return isAfter(statePensionAge.date, new Date());
  }
  return false;
};

/**
 * Takes data from Death notification and calculates whether they can proceed with BSP
 * @param {object} data
 */
const isEligibleForBsp = (data => isCallerSpouse(data) && isWorkingAge(data));

module.exports = {
  isEligibleForBsp
}