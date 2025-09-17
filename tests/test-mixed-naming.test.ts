import test from "ava"
import { Command } from "commander"
import { stringifyOptions } from "../src/stringify-options"
import { getCommandFromPath } from "../src/get-command-from-path"

test("handles mixed camelCase and kebab-case CLI flags correctly", async (t) => {
  const program = new Command()
  program.name("test-cli")

  const testCmd = program
    .command("mixed")
    .option("--includeName", "Include name (camelCase CLI flag)", false)
    .option("--include-author", "Include author (kebab-case CLI flag)", false)
    .option("--outputPath <path>", "Output path (camelCase CLI flag with value)")
    .option("--output-dir <dir>", "Output directory (kebab-case CLI flag with value)")
    .action(() => { })

  const command = getCommandFromPath(program, ["mixed"])

  // Test with all options set
  const options = {
    includeName: true,      // camelCase CLI flag → camelCase property
    includeAuthor: false,   // kebab-case CLI flag → camelCase property  
    outputPath: "/tmp",     // camelCase CLI flag → camelCase property
    outputDir: "/dist"      // kebab-case CLI flag → camelCase property
  }

  const stringified = stringifyOptions(options, command)

  // Should show:
  // - --includeName (camelCase flag, boolean true)
  // - (omit include-author since it's false)
  // - --outputPath /tmp (camelCase flag with value)
  // - --output-dir /dist (kebab-case flag with value)
  t.is(stringified, "--includeName --outputPath /tmp --output-dir /dist")

  // Test with different boolean combinations
  const optionsAllFalse = {
    includeName: false,
    includeAuthor: false,
    outputPath: "/tmp",
    outputDir: "/dist"
  }

  const stringifiedAllFalse = stringifyOptions(optionsAllFalse, command)
  t.is(stringifiedAllFalse, "--outputPath /tmp --output-dir /dist")
})
