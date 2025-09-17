import { Command, Option } from "commander"

export const camelToKebab = (str: string) => str.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '')

export const findOptionByKey = (command: Command, key: string) => {
  return command?.options?.find((o: Option) => {
    const longFlag = o.long?.replace(/^--/, "")
    const shortFlag = o.short?.replace(/^-/, "")

    if (longFlag === key || shortFlag === key) {
      return true
    }

    if (longFlag === camelToKebab(key)) {
      return true
    }

    return false
  })
}

export const getOptionFlagName = (command: Command, key: string): string => {
  const option = findOptionByKey(command, key)

  if (option) {
    return option.long?.replace(/^--/, "") || option.short?.replace(/^-/, "") || ""
  }

  return camelToKebab(key)
}