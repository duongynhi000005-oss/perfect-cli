import { Command } from "commander"
import { findOptionByKey, getOptionFlagName } from "./utils"

export const stringifyOptions = (options: Record<string, any>, command: Command) =>
  Object.entries(options)
    .filter((opt) => opt[0] !== "_")
    .map(([key, value]) => {
      const option = findOptionByKey(command, key)
      const flagName = getOptionFlagName(command, key)
      
      if (option?.isBoolean?.()) {
        return value ? `--${flagName}` : ""
      }
      
      return `--${flagName} ${value}`
    })
    .filter(Boolean)
    .join(" ")
