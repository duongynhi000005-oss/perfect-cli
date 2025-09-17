import test from "ava"
import { Command } from "commander"
import { stringifyOptions } from "../src/stringify-options"
import { stringifyCommandWithOptions } from "../src/stringify-command-with-options"
import { getCommandFromPath } from "../src/get-command-from-path"

test("stringifyOptions handles boolean options correctly", async (t) => {
    const program = new Command()
    program.name("test-cli")

    const cloneCmd = program
        .command("clone")
        .argument("<repo>", "Repository to clone")
        .option("--include-author", "Include author information", false)
        .option("--verbose", "Verbose output", false)
        .option("--output <path>", "Output path")
        .action(() => { })

    const command = getCommandFromPath(program, ["clone"])

    const optionsWithTrue = {
        includeAuthor: true,
        verbose: false,
        output: "dist"
    }

    const stringifiedTrue = stringifyOptions(optionsWithTrue, command)
    t.is(stringifiedTrue, "--include-author --output dist")

    const optionsWithFalse = {
        includeAuthor: false,
        verbose: false,
        output: "dist"
    }

    const stringifiedFalse = stringifyOptions(optionsWithFalse, command)
    t.is(stringifiedFalse, "--output dist")

    const optionsAllFalse = {
        includeAuthor: false,
        verbose: false
    }

    const stringifiedAllFalse = stringifyOptions(optionsAllFalse, command)
    t.is(stringifiedAllFalse, "")
})

test("stringifyCommandWithOptions handles boolean options correctly", async (t) => {
    const program = new Command()
    program.name("tsci")

    const cloneCmd = program
        .command("clone")
        .argument("<repo>", "Repository to clone")
        .option("--include-author", "Include author information", false)
        .option("--verbose", "Verbose output", false)
        .action(() => { })

    const options = {
        _: ["seveibar/led-water-accelerometer"],
        includeAuthor: false
    }

    const commandString = stringifyCommandWithOptions(program, ["clone"], options)
    t.is(commandString, "tsci clone seveibar/led-water-accelerometer ")

    const optionsTrue = {
        _: ["seveibar/led-water-accelerometer"],
        includeAuthor: true
    }

    const commandStringTrue = stringifyCommandWithOptions(program, ["clone"], optionsTrue)
    t.is(commandStringTrue, "tsci clone seveibar/led-water-accelerometer --include-author")
})

test("option args construction for Commander.js handles boolean options correctly", async (t) => {
    const program = new Command()
    program.name("tsci")

    const cloneCmd = program
        .command("clone")
        .argument("<repo>", "Repository to clone")
        .option("--include-author", "Include author information", false)
        .option("--verbose", "Verbose output", false)
        .option("--output <path>", "Output path")
        .action(() => { })

    const command = getCommandFromPath(program, ["clone"])

    const camelToKebab = (str: string) => str.replace(/([A-Z])/g, '-$1').toLowerCase()

    const findOptionByKey = (command: any, key: string) => {
        return command?.options?.find((o: any) => {
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

    const constructOptionArgs = (options: Record<string, any>) => {
        return Object.entries(options)
            .filter((opt) => opt[0] !== "_")
            .flatMap(([optKey, optVal]) => {
                const option = findOptionByKey(command, optKey)
                if (option?.isBoolean?.()) {
                    const flagName = option.long?.replace(/^--/, "") || option.short?.replace(/^-/, "")
                    return optVal ? [`--${flagName}`] : []
                }
                const flagName = option?.long?.replace(/^--/, "") || camelToKebab(optKey)
                return [`--${flagName}`, optVal]
            }) as string[]
    }

    const optionsFalse = {
        includeAuthor: false,
        verbose: false,
        output: "dist"
    }

    const argsFalse = constructOptionArgs(optionsFalse)
    t.deepEqual(argsFalse, ["--output", "dist"])

    const optionsTrue = {
        includeAuthor: true,
        verbose: false,
        output: "dist"
    }

    const argsTrue = constructOptionArgs(optionsTrue)
    t.deepEqual(argsTrue, ["--include-author", "--output", "dist"])

    const optionsMixed = {
        includeAuthor: true,
        verbose: true,
        output: "dist"
    }

    const argsMixed = constructOptionArgs(optionsMixed)
    t.deepEqual(argsMixed, ["--include-author", "--verbose", "--output", "dist"])
})

test("reproduces the original issue scenario", async (t) => {
    const program = new Command()
    program.name("tsci")

    let capturedOptions: any = null

    const cloneCmd = program
        .command("clone")
        .argument("[repo]", "Repository to clone")
        .option("--include-author", "Include author information", false)
        .action((repo, options) => {
            capturedOptions = { repo, ...options }
        })

    const options = {
        _: ["seveibar/led-water-accelerometer"],
        includeAuthor: false
    }

    const displayString = stringifyCommandWithOptions(program, ["clone"], options)
    t.is(displayString, "tsci clone seveibar/led-water-accelerometer ")

    const camelToKebab = (str: string) => str.replace(/([A-Z])/g, '-$1').toLowerCase()

    const findOptionByKey = (command: any, key: string) => {
        return command?.options?.find((o: any) => {
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

    const command = getCommandFromPath(program, ["clone"])
    const optionArgs = Object.entries(options)
        .filter((opt) => opt[0] !== "_")
        .flatMap(([optKey, optVal]) => {
            const option = findOptionByKey(command, optKey)
            if (option?.isBoolean?.()) {
                const flagName = option.long?.replace(/^--/, "") || option.short?.replace(/^-/, "")
                return optVal ? [`--${flagName}`] : []
            }
            const flagName = option?.long?.replace(/^--/, "") || camelToKebab(optKey)
            return [`--${flagName}`, optVal]
        }) as string[]

    t.deepEqual(optionArgs, [])

    const finalArgs = [
        "node", "tsci",
        "clone",
        ...options._ ?? [],
        ...optionArgs
    ]

    await program.parseAsync(finalArgs)

    t.is(capturedOptions.includeAuthor, false)
    t.is(capturedOptions.repo, "seveibar/led-water-accelerometer")
})
