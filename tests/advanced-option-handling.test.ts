import test from "ava"
import { Command } from "commander"
import { stringifyOptions } from "../src/stringify-options"
import { stringifyCommandWithOptions } from "../src/stringify-command-with-options"
import { getCommandFromPath } from "../src/get-command-from-path"
import { findOptionByKey, getOptionFlagName } from "../src/utils"

test("handles string options correctly", async (t) => {
    const program = new Command()
    program.name("test-cli")

    const testCmd = program
        .command("build")
        .option("--output <path>", "Output directory")
        .option("--config <file>", "Config file path")
        .option("--env <environment>", "Environment", "development")
        .option("--target <target>", "Build target")
        .action(() => { })

    const command = getCommandFromPath(program, ["build"])

    const options = {
        output: "/dist",
        config: "webpack.config.js",
        env: "production",
        target: "es2020"
    }

    const stringified = stringifyOptions(options, command)
    t.is(stringified, "--output /dist --config webpack.config.js --env production --target es2020")
})

test("handles mixed boolean and string options", async (t) => {
    const program = new Command()
    program.name("deploy-cli")

    const deployCmd = program
        .command("deploy")
        .option("--dry-run", "Perform a dry run", false)
        .option("--verbose", "Verbose output", false)
        .option("--environment <env>", "Deployment environment")
        .option("--config-file <path>", "Configuration file path")
        .option("--force", "Force deployment", false)
        .option("--timeout <seconds>", "Timeout in seconds", "300")
        .action(() => { })

    const command = getCommandFromPath(program, ["deploy"])

    const mixedOptions = {
        dryRun: true,
        verbose: false,
        environment: "prod",
        configFile: "/app/config.json",
        force: false,
        timeout: "600"
    }

    const stringified = stringifyOptions(mixedOptions, command)
    t.is(stringified, "--dry-run --environment prod --config-file /app/config.json --timeout 600")

    const allBooleansFalse = {
        dryRun: false,
        verbose: false,
        environment: "staging",
        configFile: "/staging/config.json",
        force: false,
        timeout: "120"
    }

    const stringifiedAllFalse = stringifyOptions(allBooleansFalse, command)
    t.is(stringifiedAllFalse, "--environment staging --config-file /staging/config.json --timeout 120")

    const allBooleansTrue = {
        dryRun: true,
        verbose: true,
        environment: "dev",
        configFile: "/dev/config.json",
        force: true,
        timeout: "60"
    }

    const stringifiedAllTrue = stringifyOptions(allBooleansTrue, command)
    t.is(stringifiedAllTrue, "--dry-run --verbose --environment dev --config-file /dev/config.json --force --timeout 60")
})

test("handles edge cases with string options", async (t) => {
    const program = new Command()
    program.name("edge-cli")

    const edgeCmd = program
        .command("test")
        .option("--message <msg>", "Message to display")
        .option("--path <path>", "File path")
        .option("--enable-feature", "Enable feature", false)
        .option("--count <number>", "Count value")
        .action(() => { })

    const command = getCommandFromPath(program, ["test"])

    const emptyStringOptions = {
        message: "",
        path: "/tmp",
        enableFeature: true,
        count: "0"
    }

    const stringifiedEmpty = stringifyOptions(emptyStringOptions, command)
    t.is(stringifiedEmpty, "--message  --path /tmp --enable-feature --count 0")

    const specialCharOptions = {
        message: "Hello World!",
        path: "/path/with spaces/file.txt",
        enableFeature: false,
        count: "42"
    }

    const stringifiedSpecial = stringifyOptions(specialCharOptions, command)
    t.is(stringifiedSpecial, "--message Hello World! --path /path/with spaces/file.txt --count 42")

    const booleanLikeStrings = {
        message: "true",
        path: "false",
        enableFeature: true,
        count: "yes"
    }

    const stringifiedBooleanLike = stringifyOptions(booleanLikeStrings, command)
    t.is(stringifiedBooleanLike, "--message true --path false --enable-feature --count yes")
})

test("handles option args construction with mixed types", async (t) => {
    const program = new Command()
    program.name("mixed-cli")

    const mixedCmd = program
        .command("process")
        .option("--input <file>", "Input file")
        .option("--output <file>", "Output file")
        .option("--compress", "Enable compression", false)
        .option("--optimize", "Enable optimization", false)
        .option("--format <type>", "Output format", "json")
        .option("--workers <count>", "Number of workers", "4")
        .action(() => { })

    const command = getCommandFromPath(program, ["process"])

    const constructOptionArgs = (options: Record<string, any>) => {
        return Object.entries(options)
            .filter((opt) => opt[0] !== "_")
            .flatMap(([optKey, optVal]) => {
                const option = findOptionByKey(command, optKey)
                const flagName = getOptionFlagName(command, optKey)

                if (option?.isBoolean?.()) {
                    return optVal ? [`--${flagName}`] : []
                }

                return [`--${flagName}`, optVal]
            }) as string[]
    }

    const mixedOptions = {
        input: "data.csv",
        output: "result.json",
        compress: true,
        optimize: false,
        format: "xml",
        workers: "8"
    }

    const args = constructOptionArgs(mixedOptions)
    t.deepEqual(args, [
        "--input", "data.csv",
        "--output", "result.json",
        "--compress",
        "--format", "xml",
        "--workers", "8"
    ])

    const stringOnlyOptions = {
        input: "input.txt",
        output: "output.txt",
        compress: false,
        optimize: false,
        format: "csv",
        workers: "2"
    }

    const stringArgs = constructOptionArgs(stringOnlyOptions)
    t.deepEqual(stringArgs, [
        "--input", "input.txt",
        "--output", "output.txt",
        "--format", "csv",
        "--workers", "2"
    ])

    const booleanOnlyOptions = {
        compress: true,
        optimize: true
    }

    const booleanArgs = constructOptionArgs(booleanOnlyOptions)
    t.deepEqual(booleanArgs, ["--compress", "--optimize"])
})

test("handles stringifyCommandWithOptions with complex scenarios", async (t) => {
    const program = new Command()
    program.name("complex-cli")

    const complexCmd = program
        .command("deploy")
        .argument("[project]", "Project name")
        .option("--env <environment>", "Target environment")
        .option("--dry-run", "Perform dry run", false)
        .option("--config <path>", "Config file path")
        .option("--verbose", "Verbose logging", false)
        .option("--force", "Force deployment", false)
        .option("--timeout <seconds>", "Deployment timeout")
        .action(() => { })

    const complexOptions = {
        _: ["my-project"],
        env: "production",
        dryRun: true,
        config: "/configs/prod.yml",
        verbose: false,
        force: false,
        timeout: "300"
    }

    const commandString = stringifyCommandWithOptions(program, ["deploy"], complexOptions)
    t.is(commandString, "complex-cli deploy my-project --env production --dry-run --config /configs/prod.yml --timeout 300")

    const multipleArgsOptions = {
        _: ["project1", "project2"],
        env: "staging",
        dryRun: false,
        config: "/configs/staging.yml",
        verbose: true,
        force: true,
        timeout: "600"
    }

    const multipleArgsString = stringifyCommandWithOptions(program, ["deploy"], multipleArgsOptions)
    t.is(multipleArgsString, "complex-cli deploy project1 project2 --env staging --config /configs/staging.yml --verbose --force --timeout 600")

    const noArgsOptions = {
        env: "dev",
        dryRun: false,
        config: "/configs/dev.yml",
        verbose: false,
        force: false,
        timeout: "120"
    }

    const noArgsString = stringifyCommandWithOptions(program, ["deploy"], noArgsOptions)
    t.is(noArgsString, "complex-cli deploy --env dev --config /configs/dev.yml --timeout 120")
})

test("reproduces real-world CLI scenarios", async (t) => {
    const program = new Command()
    program.name("build-tool")

    const buildCmd = program
        .command("build")
        .argument("[entry]", "Entry point")
        .option("--mode <mode>", "Build mode", "development")
        .option("--watch", "Watch for changes", false)
        .option("--minify", "Minify output", false)
        .option("--source-map", "Generate source maps", false)
        .option("--output-dir <dir>", "Output directory", "dist")
        .option("--public-path <path>", "Public path for assets")
        .option("--target <target>", "Build target", "web")
        .option("--analyze", "Analyze bundle", false)
        .action(() => { })

    let capturedOptions: any = null
    buildCmd.action((entry, options) => {
        capturedOptions = { entry, ...options }
    })

    const prodOptions = {
        _: ["src/index.js"],
        mode: "production",
        watch: false,
        minify: true,
        sourceMap: true,
        outputDir: "build",
        publicPath: "/static/",
        target: "es2018",
        analyze: false
    }

    const prodCommandString = stringifyCommandWithOptions(program, ["build"], prodOptions)
    t.is(prodCommandString, "build-tool build src/index.js --mode production --minify --source-map --output-dir build --public-path /static/ --target es2018")

    const devOptions = {
        _: ["src/app.js"],
        mode: "development",
        watch: true,
        minify: false,
        sourceMap: true,
        outputDir: "dist",
        publicPath: "/",
        target: "es2020",
        analyze: true
    }

    const devCommandString = stringifyCommandWithOptions(program, ["build"], devOptions)
    t.is(devCommandString, "build-tool build src/app.js --mode development --watch --source-map --output-dir dist --public-path / --target es2020 --analyze")

    const minimalOptions = {
        watch: false,
        minify: false,
        sourceMap: false,
        analyze: false
    }

    const minimalCommandString = stringifyCommandWithOptions(program, ["build"], minimalOptions)
    t.is(minimalCommandString, "build-tool build ")
})
