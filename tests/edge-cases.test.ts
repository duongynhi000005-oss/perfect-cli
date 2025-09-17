import test from "ava"
import { Command } from "commander"
import { stringifyOptions } from "../src/stringify-options"
import { stringifyCommandWithOptions } from "../src/stringify-command-with-options"
import { getCommandFromPath } from "../src/get-command-from-path"
import { camelToKebab } from "../src/utils"

test("handles options with special characters and edge values", async (t) => {
    const program = new Command()
    program.name("special-cli")

    const specialCmd = program
        .command("process")
        .option("--input-file <file>", "Input file path")
        .option("--output-pattern <pattern>", "Output pattern")
        .option("--enable-debug", "Enable debug mode", false)
        .option("--max-retries <count>", "Maximum retry attempts", "3")
        .action(() => { })

    const command = getCommandFromPath(program, ["process"])

    const specialOptions = {
        inputFile: "/path/with-dashes/file.txt",
        outputPattern: "*.{js,ts}",
        enableDebug: true,
        maxRetries: "5"
    }

    const stringified = stringifyOptions(specialOptions, command)
    t.is(stringified, "--input-file /path/with-dashes/file.txt --output-pattern *.{js,ts} --enable-debug --max-retries 5")

    const edgeValueOptions = {
        inputFile: "",
        outputPattern: "null",
        enableDebug: false,
        maxRetries: "0"
    }

    const edgeStringified = stringifyOptions(edgeValueOptions, command)
    t.is(edgeStringified, "--input-file  --output-pattern null --max-retries 0")
})

test("handles nested command structures", async (t) => {
    const program = new Command()
    program.name("nested-cli")

    const dbCmd = program.command("db").description("Database operations")

    const migrateCmd = dbCmd
        .command("migrate")
        .option("--up", "Run up migrations", false)
        .option("--down", "Run down migrations", false)
        .option("--steps <number>", "Number of steps", "1")
        .option("--dry-run", "Dry run mode", false)
        .option("--connection <url>", "Database connection URL")
        .action(() => { })

    const command = getCommandFromPath(program, ["db", "migrate"])

    const nestedOptions = {
        up: true,
        down: false,
        steps: "3",
        dryRun: true,
        connection: "postgresql://localhost:5432/mydb"
    }

    const nestedStringified = stringifyOptions(nestedOptions, command)
    t.is(nestedStringified, "--up --steps 3 --dry-run --connection postgresql://localhost:5432/mydb")

    const nestedCommandString = stringifyCommandWithOptions(program, ["db", "migrate"], nestedOptions)
    t.is(nestedCommandString, "nested-cli db migrate --up --steps 3 --dry-run --connection postgresql://localhost:5432/mydb")
})

test("handles options with short flags", async (t) => {
    const program = new Command()
    program.name("short-cli")

    const shortCmd = program
        .command("build")
        .option("-v, --verbose", "Verbose output", false)
        .option("-o, --output <dir>", "Output directory")
        .option("-w, --watch", "Watch mode", false)
        .option("-m, --minify", "Minify output", false)
        .option("-c, --config <file>", "Config file")
        .action(() => { })

    const command = getCommandFromPath(program, ["build"])

    const shortFlagOptions = {
        verbose: true,
        output: "dist",
        watch: false,
        minify: true,
        config: "build.config.js"
    }

    const shortStringified = stringifyOptions(shortFlagOptions, command)
    t.is(shortStringified, "--verbose --output dist --minify --config build.config.js")
})

test("handles camelCase conversion edge cases", async (t) => {
    t.is(camelToKebab("simpleCase"), "simple-case")
    t.is(camelToKebab("XMLHttpRequest"), "x-m-l-http-request")
    t.is(camelToKebab("HTMLElement"), "h-t-m-l-element")
    t.is(camelToKebab("iOS"), "i-o-s")
    t.is(camelToKebab("iPhone"), "i-phone")
    t.is(camelToKebab("camelCaseString"), "camel-case-string")
    t.is(camelToKebab("alreadyKebab"), "already-kebab")
    t.is(camelToKebab("a"), "a")
    t.is(camelToKebab(""), "")

    const program = new Command()
    program.name("complex-cli")

    const complexCmd = program
        .command("transform")
        .option("--xml-http-request", "XMLHttpRequest option", false)
        .option("--html-output", "HTML output", false)
        .option("--api-key <key>", "API key")
        .option("--i-os-build", "iOS build", false)
        .action(() => { })

    const command = getCommandFromPath(program, ["transform"])

    const complexOptions = {
        xmlHttpRequest: true,
        htmlOutput: false,
        apiKey: "secret123",
        iOsBuild: true
    }

    const complexStringified = stringifyOptions(complexOptions, command)
    t.is(complexStringified, "--xml-http-request --api-key secret123 --i-os-build")
})

test("handles missing command gracefully", async (t) => {
    const options = {
        someOption: "value",
        booleanOption: true
    }

    const stringifiedNoCommand = stringifyOptions(options, undefined as any)
    t.is(stringifiedNoCommand, "--some-option value --boolean-option true")

    const stringifiedNullCommand = stringifyOptions(options, null as any)
    t.is(stringifiedNullCommand, "--some-option value --boolean-option true")
})

test("handles options with array-like and object-like string values", async (t) => {
    const program = new Command()
    program.name("data-cli")

    const dataCmd = program
        .command("process")
        .option("--json-data <data>", "JSON data")
        .option("--array-values <values>", "Array values")
        .option("--enable-parsing", "Enable parsing", false)
        .option("--format <format>", "Output format")
        .action(() => { })

    const command = getCommandFromPath(program, ["process"])

    const complexDataOptions = {
        jsonData: '{"key": "value", "nested": {"prop": true}}',
        arrayValues: "[1, 2, 3, 4]",
        enableParsing: true,
        format: "json"
    }

    const complexDataStringified = stringifyOptions(complexDataOptions, command)
    t.is(complexDataStringified, '--json-data {"key": "value", "nested": {"prop": true}} --array-values [1, 2, 3, 4] --enable-parsing --format json')
})

test("handles real-world CLI tool simulation", async (t) => {
    const program = new Command()
    program.name("bundler")

    let capturedArgs: any = null

    const bundleCmd = program
        .command("bundle")
        .argument("[entry...]", "Entry points")
        .option("--mode <mode>", "Build mode", "development")
        .option("--watch", "Watch for changes", false)
        .option("--hot", "Hot module replacement", false)
        .option("--source-map", "Generate source maps", false)
        .option("--minify", "Minify output", false)
        .option("--tree-shake", "Enable tree shaking", false)
        .option("--output-dir <dir>", "Output directory", "dist")
        .option("--public-path <path>", "Public path", "/")
        .option("--chunk-size-limit <size>", "Chunk size limit", "244")
        .option("--target <target>", "Build target", "es2015")
        .option("--external <modules>", "External modules")
        .option("--global-name <name>", "Global variable name")
        .option("--analyze", "Analyze bundle", false)
        .option("--silent", "Silent mode", false)
        .option("--verbose", "Verbose logging", false)
        .action((entries, options) => {
            capturedArgs = { entries, ...options }
        })

    const command = getCommandFromPath(program, ["bundle"])

    const productionOptions = {
        _: ["src/main.js", "src/worker.js"],
        mode: "production",
        watch: false,
        hot: false,
        sourceMap: true,
        minify: true,
        treeShake: true,
        outputDir: "build",
        publicPath: "/static/js/",
        chunkSizeLimit: "500",
        target: "es2018",
        external: "react,react-dom",
        globalName: "MyLibrary",
        analyze: true,
        silent: false,
        verbose: false
    }

    const prodCommandString = stringifyCommandWithOptions(program, ["bundle"], productionOptions)
    const expectedProdString = "bundler bundle src/main.js src/worker.js --mode production --source-map --minify --tree-shake --output-dir build --public-path /static/js/ --chunk-size-limit 500 --target es2018 --external react,react-dom --global-name MyLibrary --analyze"
    t.is(prodCommandString, expectedProdString)

    const developmentOptions = {
        _: ["src/index.js"],
        mode: "development",
        watch: true,
        hot: true,
        sourceMap: true,
        minify: false,
        treeShake: false,
        outputDir: "dev-build",
        publicPath: "/",
        chunkSizeLimit: "1000",
        target: "es2020",
        analyze: false,
        silent: false,
        verbose: true
    }

    const devCommandString = stringifyCommandWithOptions(program, ["bundle"], developmentOptions)
    const expectedDevString = "bundler bundle src/index.js --mode development --watch --hot --source-map --output-dir dev-build --public-path / --chunk-size-limit 1000 --target es2020 --verbose"
    t.is(devCommandString, expectedDevString)

    const testArgs = [
        "node", "bundler", "bundle", "src/app.js",
        "--mode", "production",
        "--minify",
        "--output-dir", "dist",
        "--analyze"
    ]

    await program.parseAsync(testArgs)

    t.is(capturedArgs.entries[0], "src/app.js")
    t.is(capturedArgs.mode, "production")
    t.is(capturedArgs.minify, true)
    t.is(capturedArgs.outputDir, "dist")
    t.is(capturedArgs.analyze, true)
    t.is(capturedArgs.watch, false)
})
