export const PH_PHONE_LENGTH = 11

export function sanitizePhoneNumber(value: string) {
  return value.replace(/\D/g, '').slice(0, PH_PHONE_LENGTH)
}

export function isValidPhilippinePhoneNumber(value: string) {
  return /^[0-9]{11}$/.test(value)
}
