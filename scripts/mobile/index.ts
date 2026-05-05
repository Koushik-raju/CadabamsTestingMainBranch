/**
 * FILE: scripts/mobile/index.ts
 *
 * PURPOSE:
 *   Interactive CLI that wraps Capacitor commands so the team can build,
 *   sync, run, and ship iOS / Android builds without memorising flags or
 *   the right `CAP_REMOTE_URL` for each environment. Native shell is
 *   remote-only — every command bakes the chosen remote URL into the
 *   native project at sync time.
 *
 * LOGIC OVERVIEW:
 *   1. Prompt for platform (iOS / Android / Both).
 *   2. Prompt for action (sync / open / run / debug build / release build).
 *   3. Prompt for environment (staging / prod / localhost / custom URL).
 *   4. Build the env (CAP_REMOTE_URL + NODE_ENV) and the command list.
 *   5. Confirm, then run each command sequentially via execa with the
 *      project root as cwd. Inherit stdio so Xcode / Gradle output streams
 *      live to the terminal.
 *
 * KEY VARIABLES / EXPORTS:
 *   ENVIRONMENTS — preset remote URLs keyed by environment name
 *   ACTIONS      — per-platform action menus + the commands they expand to
 *   main()       — top-level prompt + dispatch loop
 *
 * DEPENDENCIES:
 *   @inquirer/prompts — interactive prompts
 *   execa             — spawn child processes
 *   picocolors        — terminal colors
 *
 * LAST UPDATED: 2026-05-05 — initial CLI: sync, open, run, debug APK,
 *   release AAB, iOS archive scaffold.
 */

import { existsSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { confirm, input, select } from "@inquirer/prompts";
import { execa, execaSync } from "execa";
import pc from "picocolors";

const __dirname = dirname(fileURLToPath(import.meta.url));
/* Project root = two levels up from scripts/mobile/. Every command runs
   here so relative paths (ios/, android/) resolve correctly. */
const PROJECT_ROOT = resolve(__dirname, "..", "..");

type Platform = "ios" | "android" | "both";
type EnvKey = "staging" | "prod" | "localhost" | "custom";

const ENVIRONMENTS: Record<Exclude<EnvKey, "custom">, string> = {
  staging: "https://dev-x3.cadabams.com/",
  prod: "https://cadabams.com/",
  localhost: "http://localhost:3001/",
};

interface Step {
  label: string;
  cmd: string;
  args: string[];
  cwd?: string;
  /* When true, this step needs JDK 21/17 (Android Gradle). Will resolve
     JAVA_HOME via /usr/libexec/java_home -v <ver> and inject into env. */
  needsJdk?: boolean;
}

/* Resolve a Gradle-compatible JAVA_HOME by trying JDK 21 then 17 via the
   macOS java_home helper. Returns null if neither is installed. */
function resolveJavaHome(): string | null {
  const candidates = ["21", "17"];
  for (const v of candidates) {
    try {
      const { stdout } = execaSync("/usr/libexec/java_home", ["-v", v], { reject: false });
      if (stdout && existsSync(stdout.trim())) return stdout.trim();
    } catch {
      /* try next */
    }
  }
  return null;
}

async function pickPlatform(): Promise<Platform> {
  return select<Platform>({
    message: "Which platform?",
    choices: [
      { name: "iOS", value: "ios" },
      { name: "Android", value: "android" },
      { name: "Both (sync only)", value: "both" },
    ],
  });
}

async function pickAction(platform: Platform): Promise<string> {
  if (platform === "both") {
    return "sync";
  }
  if (platform === "ios") {
    return select<string>({
      message: "iOS — what do you want to do?",
      default: "release",
      choices: [
        { name: "🚀 BUILD release archive for TestFlight (sync + open Xcode)", value: "release" },
        { name: "▶️  Run on booted simulator (sync + cap run)", value: "run" },
        { name: "📂 Open Xcode only (sync + cap open)", value: "open" },
        {
          name: "🔄 Sync only — no build, no open (just push CAP_REMOTE_URL into ios/)",
          value: "sync",
        },
      ],
    });
  }
  return select<string>({
    message: "Android — what do you want to do?",
    default: "release",
    choices: [
      {
        name: "🚀 BUILD release AAB for Play Console (sync + ./gradlew bundleRelease)",
        value: "release",
      },
      { name: "🔨 BUILD debug APK (sync + ./gradlew assembleDebug)", value: "debug" },
      { name: "▶️  Run on connected device/emulator (sync + cap run)", value: "run" },
      { name: "📂 Open Android Studio only (sync + cap open)", value: "open" },
      {
        name: "🔄 Sync only — no build, no open (just push CAP_REMOTE_URL into android/)",
        value: "sync",
      },
    ],
  });
}

async function pickRemoteUrl(): Promise<string> {
  const choice = await select<EnvKey>({
    message: "Which remote URL should the WebView load?",
    choices: [
      { name: `Staging — ${ENVIRONMENTS.staging}`, value: "staging" },
      { name: `Prod    — ${ENVIRONMENTS.prod}`, value: "prod" },
      { name: `Localhost (sim only) — ${ENVIRONMENTS.localhost}`, value: "localhost" },
      { name: "Custom URL…", value: "custom" },
    ],
  });
  if (choice === "custom") {
    return input({
      message: "Custom remote URL (must end with /):",
      validate: (v) => /^https?:\/\/.+\/$/.test(v) || "Must be http(s):// and end with /",
    });
  }
  return ENVIRONMENTS[choice];
}

function buildSteps(platform: Platform, action: string): Step[] {
  const syncTarget = platform === "both" ? "" : platform;
  const syncStep: Step = {
    label: `Capacitor sync ${syncTarget || "all"}`,
    cmd: "npx",
    args: ["cap", "sync", ...(syncTarget ? [syncTarget] : [])],
  };

  if (action === "sync") return [syncStep];

  if (platform === "ios") {
    if (action === "open") {
      return [syncStep, { label: "Open Xcode", cmd: "npx", args: ["cap", "open", "ios"] }];
    }
    if (action === "run") {
      return [syncStep, { label: "Run on iOS simulator", cmd: "npx", args: ["cap", "run", "ios"] }];
    }
    if (action === "release") {
      /* Release for iOS is sync-only here. We do NOT auto-archive: the
         first archive must be done in Xcode to generate ExportOptions.plist
         + register provisioning profiles. After that, the printed CLI
         steps (printIosReleaseInstructions) cover archive + upload. */
      return [syncStep];
    }
  }

  if (platform === "android") {
    if (action === "open") {
      return [
        syncStep,
        { label: "Open Android Studio", cmd: "npx", args: ["cap", "open", "android"] },
      ];
    }
    if (action === "run") {
      return [
        syncStep,
        { label: "Run on Android device/emulator", cmd: "npx", args: ["cap", "run", "android"] },
      ];
    }
    if (action === "debug") {
      return [
        syncStep,
        {
          label: "Gradle assembleDebug → app-debug.apk",
          cmd: "./gradlew",
          args: ["assembleDebug"],
          cwd: resolve(PROJECT_ROOT, "android"),
          needsJdk: true,
        },
      ];
    }
    if (action === "release") {
      return [
        syncStep,
        {
          label: "Gradle bundleRelease → app-release.aab",
          cmd: "./gradlew",
          args: ["bundleRelease"],
          cwd: resolve(PROJECT_ROOT, "android"),
          needsJdk: true,
        },
      ];
    }
  }

  return [syncStep];
}

async function runStep(step: Step, baseEnv: NodeJS.ProcessEnv): Promise<void> {
  let env = baseEnv;

  if (step.needsJdk) {
    const javaHome = resolveJavaHome();
    if (!javaHome) {
      console.error(
        pc.red("\n✗ No compatible JDK found. Gradle / Android Gradle Plugin needs JDK 21 or 17."),
      );
      console.error(
        pc.yellow("  Install with: brew install --cask temurin@21    (sudo password required)"),
      );
      console.error(pc.yellow("  Then re-run pnpm mobile."));
      process.exit(1);
    }
    console.log(pc.dim(`  JAVA_HOME=${javaHome}`));
    env = { ...env, JAVA_HOME: javaHome, PATH: `${javaHome}/bin:${env.PATH ?? ""}` };
  }

  console.log(pc.cyan(`\n▶ ${step.label}`));
  console.log(
    pc.dim(`  ${step.cmd} ${step.args.join(" ")}${step.cwd ? `  (cwd: ${step.cwd})` : ""}`),
  );
  await execa(step.cmd, step.args, {
    cwd: step.cwd ?? PROJECT_ROOT,
    env,
    stdio: "inherit",
  });
}

async function main(): Promise<void> {
  console.log(pc.bold(pc.magenta("\n📱 Cadabams Mobile CLI\n")));

  const platform = await pickPlatform();
  const action = await pickAction(platform);
  const remoteUrl = await pickRemoteUrl();
  const isProd = action === "release" || remoteUrl === ENVIRONMENTS.prod;

  const env: NodeJS.ProcessEnv = {
    ...process.env,
    CAP_REMOTE_URL: remoteUrl,
    NODE_ENV: isProd ? "production" : "development",
  };

  const steps = buildSteps(platform, action);

  console.log(pc.bold("\nPlan"));
  console.log(`  Platform     : ${pc.green(platform)}`);
  console.log(`  Action       : ${pc.green(action)}`);
  console.log(`  Remote URL   : ${pc.green(remoteUrl)}`);
  console.log(`  NODE_ENV     : ${pc.green(env.NODE_ENV ?? "")}`);
  console.log(`  Steps        :`);
  steps.forEach((s, i) => console.log(`    ${i + 1}. ${s.label}`));

  const proceed = await confirm({ message: "Run these steps?", default: true });
  if (!proceed) {
    console.log(pc.yellow("Aborted."));
    return;
  }

  for (const step of steps) {
    await runStep(step, env);
  }

  console.log(pc.green("\n✓ Done."));
  printArtifacts(platform, action);
  if (platform === "ios" && action === "release") printIosReleaseInstructions();
  if (platform === "android" && action === "release") printAndroidReleaseInstructions();
}

function printIosReleaseInstructions(): void {
  const iosApp = resolve(PROJECT_ROOT, "ios/App");
  console.log(pc.bold("\niOS → TestFlight: signing + upload\n"));
  console.log(pc.cyan("Prerequisites (one-time)"));
  console.log("  1. Apple Developer account, Team ID handy.");
  console.log("  2. App Store Connect → My Apps → '+' → New App");
  console.log("       Bundle ID: com.mindtalk.com (must match capacitor.config.ts)");
  console.log("       SKU: any unique string. Platform: iOS.");
  console.log(
    "  3. Xcode → Settings → Accounts → add your Apple ID, then 'Download Manual Profiles'.",
  );
  console.log("  4. App Store Connect → Users and Access → Keys → '+' → create API key with");
  console.log(
    "     'App Manager' role. Download the .p8 (one-time download). Note the Key ID + Issuer ID.",
  );
  console.log("     Save .p8 to: ~/.appstoreconnect/private_keys/AuthKey_<KEY_ID>.p8");

  console.log(pc.cyan("\nFirst-time archive (required to generate ExportOptions.plist)"));
  console.log(`  cd ${iosApp}`);
  console.log("  open App.xcworkspace");
  console.log("  In Xcode:");
  console.log("    a. Select 'App' target → Signing & Capabilities");
  console.log("       - Team: <your team>");
  console.log("       - Automatically manage signing: ON");
  console.log("       - Bundle Identifier: com.mindtalk.com");
  console.log("    b. Top bar → device dropdown → 'Any iOS Device (arm64)'.");
  console.log("    c. General tab → bump 'Build' (e.g. 1 → 2).");
  console.log("    d. Product → Archive  (~3–5 min).");
  console.log("    e. Organizer auto-opens → 'Distribute App' → 'App Store Connect' → 'Upload'.");
  console.log("    f. After upload, save ExportOptions.plist (Organizer → Export):");
  console.log(`       ${iosApp}/ExportOptions.plist`);

  console.log(pc.cyan("\nSubsequent releases (CLI, no Xcode UI)"));
  console.log("  Bump build number first:");
  console.log(`    cd ${iosApp}`);
  console.log(`    agvtool next-version -all     # or edit Info.plist CFBundleVersion`);
  console.log("  Archive + export + upload:");
  console.log("    xcodebuild -workspace App.xcworkspace -scheme App -configuration Release \\");
  console.log('      -destination "generic/platform=iOS" \\');
  console.log("      -archivePath build/App.xcarchive archive");
  console.log("    xcodebuild -exportArchive -archivePath build/App.xcarchive \\");
  console.log("      -exportOptionsPlist ExportOptions.plist \\");
  console.log("      -exportPath build/ipa");
  console.log("    xcrun altool --upload-app -f build/ipa/App.ipa -t ios \\");
  console.log("      --apiKey <KEY_ID> --apiIssuer <ISSUER_ID>");

  console.log(pc.cyan("\nProcessing → TestFlight"));
  console.log("  • Upload completes in ~1 min, Apple processing takes ~10–30 min.");
  console.log(
    "  • App Store Connect → your app → TestFlight tab → build appears under 'iOS Builds'.",
  );
  console.log(
    "  • Add to a Test Group (Internal or External). Internal testers can install immediately.",
  );
  console.log("  • External testers require Beta Review (~24 h first time).");

  console.log(pc.cyan("\nCommon failures"));
  console.log("  • 'No provisioning profile found' → in Xcode Signing & Caps, click 'Try again'.");
  console.log(
    "  • 'Bundle ID mismatch' → confirm com.mindtalk.com is the App Store Connect record.",
  );
  console.log(
    "  • 'Build number already used' → bump CFBundleVersion (agvtool next-version -all).",
  );
  console.log(
    "  • 'Missing Push entitlement' → add Push Notifications capability + matching profile.",
  );
}

function printAndroidReleaseInstructions(): void {
  const aab = resolve(PROJECT_ROOT, "android/app/build/outputs/bundle/release/app-release.aab");
  const keystorePath = "~/cadabams-release.keystore";
  const keystorePropsPath = resolve(PROJECT_ROOT, "android/keystore.properties");
  console.log(pc.bold("\nAndroid → Play Console (Internal Testing): signing + upload\n"));

  console.log(pc.cyan("Prerequisites (one-time)"));
  console.log("  1. Play Console account ($25 one-time). Create the app entry.");
  console.log("     Application ID must match capacitor.config.ts → appId: com.mindtalk.com");
  console.log("  2. Generate a release keystore (KEEP IT SAFE — losing it means losing the app):");
  console.log(`     keytool -genkey -v -keystore ${keystorePath} \\`);
  console.log("       -alias cadabams -keyalg RSA -keysize 2048 -validity 10000");
  console.log(`  3. Create ${keystorePropsPath} (gitignored):`);
  console.log("       storeFile=/Users/cadabamscreativeteam/cadabams-release.keystore");
  console.log("       storePassword=...");
  console.log("       keyAlias=cadabams");
  console.log("       keyPassword=...");
  console.log("  4. Wire it into android/app/build.gradle:");
  console.log("       Add at top:");
  console.log("         def keystoreProps = new Properties()");
  console.log(
    '         keystoreProps.load(new FileInputStream(rootProject.file("keystore.properties")))',
  );
  console.log("       In android { signingConfigs { ... } }:");
  console.log("         release { ");
  console.log('           storeFile     file(keystoreProps["storeFile"])');
  console.log('           storePassword keystoreProps["storePassword"]');
  console.log('           keyAlias      keystoreProps["keyAlias"]');
  console.log('           keyPassword   keystoreProps["keyPassword"]');
  console.log("         }");
  console.log("       In android { buildTypes { release { ... } } }:");
  console.log("         signingConfig signingConfigs.release");
  console.log("  5. Bump versionCode + versionName in android/app/build.gradle for every release.");

  console.log(pc.cyan("\nUpload"));
  console.log(`  AAB output:  ${aab}`);
  console.log("  1. Play Console → your app → Testing → Internal testing → 'Create new release'.");
  console.log("  2. Upload the .aab above.");
  console.log("  3. Add release notes → 'Save' → 'Review release' → 'Start rollout'.");
  console.log("  4. Internal testing tab → 'Testers' → add an email list / Google Group.");
  console.log("  5. Copy the opt-in URL Google generates and share with testers.");
  console.log(
    "  6. Testers click the URL → 'Become a tester' → install via Play Store on Android.",
  );

  console.log(pc.cyan("\nPromoting up the tracks"));
  console.log("  Internal → Closed (alpha/beta) → Open testing → Production.");
  console.log("  Each level has its own Beta Review (~hours to days).");

  console.log(pc.cyan("\nCommon failures"));
  console.log(
    "  • 'You uploaded an APK signed with debug key' → signingConfig not wired in build.gradle.",
  );
  console.log(
    "  • 'Version code <N> has already been used' → bump versionCode in android/app/build.gradle.",
  );
  console.log(
    "  • 'Application ID does not match' → must equal Play Console package name AND appId.",
  );
  console.log(
    "  • Lost keystore → cannot ship updates. Use Play App Signing (recommended) so Google holds the upload key.",
  );
}

/* Print absolute paths to the freshly produced artifacts so the user can
   open / upload them directly. Only prints paths that actually exist on
   disk after the build completes. */
function printArtifacts(platform: Platform, action: string): void {
  const artifacts: { label: string; path: string }[] = [];

  if (platform === "android") {
    const base = resolve(PROJECT_ROOT, "android/app/build/outputs");
    if (action === "debug") {
      artifacts.push({ label: "Debug APK", path: `${base}/apk/debug/app-debug.apk` });
    }
    if (action === "release") {
      artifacts.push({
        label: "Release AAB (upload to Play Console)",
        path: `${base}/bundle/release/app-release.aab`,
      });
      artifacts.push({
        label: "Release APK (sideload)",
        path: `${base}/apk/release/app-release.apk`,
      });
      artifacts.push({
        label: "Mapping file (crash deobfuscation)",
        path: `${base}/mapping/release/mapping.txt`,
      });
    }
  }

  if (platform === "ios" && action === "release") {
    artifacts.push({
      label: "Xcode Archives directory",
      path: `${homedir()}/Library/Developer/Xcode/Archives`,
    });
    artifacts.push({
      label: "iOS build dir (CLI exports land here)",
      path: resolve(PROJECT_ROOT, "ios/App/build"),
    });
  }

  const existing = artifacts.filter((a) => existsSync(a.path));
  if (existing.length === 0) return;

  console.log(pc.bold("\nArtifacts"));
  for (const a of existing) {
    const s = statSync(a.path);
    const size = s.isFile() ? `  (${(s.size / 1024 / 1024).toFixed(1)} MB)` : "";
    console.log(`  ${pc.cyan(a.label)}${size}`);
    console.log(`    ${pc.dim("file://")}${a.path}`);
  }

  if (platform === "ios" && action === "release") {
    console.log(
      pc.yellow(
        "\n  Next: in Xcode → 'Any iOS Device (arm64)' → Product → Archive → Distribute App → App Store Connect → Upload.",
      ),
    );
  }
  if (platform === "android" && action === "release") {
    console.log(pc.yellow("\n  Next: upload the AAB above to Play Console → Internal testing."));
  }
}

main().catch((err: unknown) => {
  if (err instanceof Error && err.name === "ExitPromptError") {
    console.log(pc.yellow("\n👋 Cancelled."));
    process.exit(0);
  }
  console.error(pc.red("\n✗ Failed:"), err);
  process.exit(1);
});
