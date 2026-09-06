# Stage 4 Student Guide: From GitHub Fork to Running Simulation

This guide takes you through the complete Stage 4 workflow in a web browser. Your personal GitHub fork is the only repository you edit. Your completed Stage 4 specification is the only file you attach to ChatGPT.

The course repository is prepared with Stages 1–3 and Stages 5–14 already present. Stage 4 is the one missing link in the capability chain. You will create exactly these three implementation files:

- `src/student/physics/trim-response.js`
- `src/student/features/trim-response.feature.js`
- `tests/student/trim-response.test.js`

Do not edit `src/core`, install another package, or let ChatGPT redesign the application.

Before you add them, Stages 1–3 should be installed, Stage 4 should show **Ready to build**, and Stages 5–14 should be present but locked behind the missing Stage 4 capability. After the three correct Stage 4 files are installed, the application resolves the complete dependency chain and unlocks the later stages automatically.

## Before you begin

You need:

- a GitHub account;
- access to ordinary ChatGPT;
- a completed and instructor-approved copy of [`STAGE-4-TRIM-RESPONSE-STARTER.md`](../templates/STAGE-4-TRIM-RESPONSE-STARTER.md); and
- the instructor-provided course repository containing Stages 1–3 and Stages 5–14.

The Stage 4 assignment uses feature ID `trim-response`, learning mode `concept`, and topic ID `stability`. It must consume `loads.pitch.component-sum` Version 1 and provide `stability.pitch.cm-alpha` Version 1. Use only the canonical inputs and engineering relationships in the approved specification.

## 1. Fork the course repository

1. Sign in at [GitHub](https://github.com/).
2. Open the course repository: [Chula-Aero-Engineering/intro-aero-digital-twin](https://github.com/Chula-Aero-Engineering/intro-aero-digital-twin).
3. Select **Fork** in the upper-right corner.
4. Under **Owner**, select your personal GitHub account.
5. Keep the repository name `intro-aero-digital-twin`.
6. Leave **Copy the `main` branch only** selected.
7. Select **Create fork** and wait for GitHub to finish.
8. Confirm that the new page shows your username in the address:

   ```text
   https://github.com/YOUR-USERNAME/intro-aero-digital-twin
   ```

9. Confirm that the page says it was forked from `Chula-Aero-Engineering/intro-aero-digital-twin`.

From this point forward, work in the repository under **your username**, not the instructor's repository.

## 2. Open your fork in GitHub Codespaces

Codespaces gives you a browser-based editor and terminal, so you do not need to install Node.js or VS Code on your device.

1. In your fork, confirm the branch selector shows `main`.
2. Select the green **Code** button.
3. Select the **Codespaces** tab.
4. Select **Create codespace on main**.
5. Wait for the editor to load and for the setup process to finish. The repository automatically runs `npm ci` to install its dependencies.
6. Open **Terminal → New Terminal** if a terminal is not already visible.
7. Run the existing tests before changing anything:

   ```bash
   npm test
   ```

Do not continue until the existing tests pass. If they do not, save the complete first error message and ask your instructor before adding Stage 4.

Now run the application once to verify the prepared starting state:

```bash
npm run dev
```

Open the forwarded **Aircraft digital twin** port, select **Stability**, and confirm:

- Stages 1–3 are installed;
- Stage 4, **Live Cm–alpha relationship and trim**, says **Ready to build**; and
- Stages 5–14 are listed but locked.

If that is not what you see, stop and show your instructor the URL of your fork and a screenshot of the Stability topic. Do not ask ChatGPT to create or repair any stage other than Stage 4. Stop the development server with **Control+C** before continuing.

## Updating an existing fork and specification

**Sync fork updates GitHub; it does not update an existing Codespace.** Save your work and commit your student files first. On your GitHub fork choose **Sync fork → Update branch**, then in the Codespaces terminal run:

```bash
git pull --no-rebase --no-edit origin main
npm test
```

If Git reports conflicts or uncommitted changes that prevent the pull, stop and share the output. Do not discard work or force-push. The merge preserves committed student work. An installed Stage 4 may now fail the new integration checks even if its old physics tests passed; use the updated contract below to regenerate it.

For an existing completed specification, preserve Sections 1–12. Replace only the section beginning **Fixed AI Implementation Contract — Do Not Edit** through the end of the file with that entire section from the updated `templates/STAGE-4-TRIM-RESPONSE-STARTER.md`. Confirm it contains revision `stage4-adapter-2026-09-06`. Syncing does not replace the contract in your personal copy automatically.

Download the updated completed specification and attach it to a new ChatGPT conversation. Use the interpretation and approval process in Sections 4–5. After approval, request complete replacements for the same three files; overwrite them in their original locations. Do not place backup `.feature.js` files in the features directory. No extra student file, dependency, or app change is needed.

After replacement run `npm test` and `npm run build`, then check Stage 4 Outputs, Verification, and Plots. If an integration check fails, attach the current three student files and full first failure to the same ChatGPT conversation with:

> Repair only these three student files against the attached specification's fixed adapter contract. Preserve the approved engineering reasoning. Diagnose the reported integration failure, and return complete replacement files. Do not change instructor tests or other stages. If engineering information is missing or contradictory, ask for clarification instead of inventing it.

## 3. Prepare the one file ChatGPT needs

ChatGPT does not need access to your GitHub repository. It needs one completed and instructor-approved specification containing both the Stage 4 engineering definition and the fixed application contract.

Use the partially completed Stage 4 starter instead of filling all 12 sections of the generic template:

1. In the Codespaces Explorer, open `templates/STAGE-4-TRIM-RESPONSE-STARTER.md`.
2. Make a student-owned copy at `student-work/specs/trim-response.md`.
3. Complete every `[COMPLETE]` and `[SHOW WORK]` field. The assigned question, model, inputs, outputs, assumptions, limits, plot, metadata, paths, and application contract are already provided.
4. Do not edit the instructor-provided sections or anything under **Fixed AI Implementation Contract — Do Not Edit**.
5. Search the completed file for `[` and confirm that no `[COMPLETE]` or `[SHOW WORK]` marker remains.
6. Check the specification against your manual reference calculation and obtain instructor approval.
7. Right-click `student-work/specs/trim-response.md` and select **Download** so it can be attached to ChatGPT.

You are responsible for the prediction statements, manual reference calculation, three verification cases, and engineering decision. ChatGPT must not fill those sections for you or guess any missing engineering content.

## 4. Ask ChatGPT for an interpretation first

1. Start a new ordinary ChatGPT conversation.
2. Attach only your completed `trim-response.md` specification.
3. Send this prompt exactly:

   ```text
   Review the attached completed Stage 4 specification and follow the Fixed AI Implementation Contract in the file. Use only the engineering model and application contract in that specification.

   First return the complete Implementation Interpretation. Do not generate code, pseudocode, snippets, or extra files yet. If any engineering information is missing or contradictory, identify it instead of inventing it.
   ```

4. Read ChatGPT's **Implementation Interpretation** carefully.
5. Compare it with your approved specification and manual calculation. Check:

   - every equation and variable;
   - degrees versus radians and all other units;
   - the pitching-moment and angle-of-attack sign conventions;
   - trim and restoring/neutral/destabilizing classifications;
   - expected trends and boundary behavior;
   - assumptions and validity limits;
   - every test case; and
   - the three exact file paths.

If anything is wrong, describe the engineering correction. ChatGPT should return a complete revised interpretation and still no code.

## 5. Approve the interpretation and request the three files

Only when the displayed interpretation matches the approved engineering specification, reply in the same ChatGPT conversation with exactly:

```text
APPROVE ENGINEERING INTERPRETATION
```

ChatGPT should now return the complete contents of exactly these files and no others:

```text
src/student/physics/trim-response.js
src/student/features/trim-response.feature.js
tests/student/trim-response.test.js
```

Before copying, confirm that:

- all three file paths are exact;
- each file is complete rather than a patch or partial snippet;
- the physics file contains the engineering equations as pure JavaScript functions;
- the feature file imports those functions instead of repeating the equations;
- the feature exports `contractVersion: 4` and the assigned capability metadata;
- the test file uses Vitest and tests the physics functions; and
- ChatGPT did not ask you to edit an existing file.

## 6. Add the three files to your fork

Return to the Codespace for your fork. Use the Explorer on the left to create each file in its exact folder.

### File 1: physics

1. Open `src/student/physics`.
2. Select **New File** and name it `trim-response.js`.
3. Copy only the JavaScript inside ChatGPT's physics-file code block.
4. Paste it into the new file and save.

### File 2: feature definition

1. Open `src/student/features`.
2. Create `trim-response.feature.js`.
3. Copy only the JavaScript inside ChatGPT's feature-file code block.
4. Paste it into the new file and save.

### File 3: tests

1. Open `tests/student`.
2. Create `trim-response.test.js`.
3. Copy only the JavaScript inside ChatGPT's test-file code block.
4. Paste it into the new file and save.

Do not paste the filename label, Markdown backticks, or words such as `javascript` into the files. The Codespaces Source Control panel should show the three new implementation files. It may also show your student-owned specification if you created it in Step 3.

## 7. Test the Stage 4 implementation

In the Codespaces terminal, run:

```bash
npm test
```

All tests—not only the new Stage 4 tests—must pass. A passing test shows that the code behaved as specified for the tested cases; it does not by itself prove that the engineering model is valid.

If a test fails:

1. Do not delete the test or weaken its tolerance merely to make it pass.
2. Copy the first failure, the manual expected value, and the relevant generated file into ChatGPT.
3. Ask ChatGPT to identify whether the problem is the equation, units, expected value, tolerance, or implementation.
4. Request the complete corrected contents of only the affected generated file.
5. Save the correction and run `npm test` again.

## 8. Run the digital-twin application from the Codespace

When all tests pass, run:

```bash
npm run dev
```

Keep this terminal running. GitHub Codespaces should automatically open the forwarded port named **Aircraft digital twin**. If it does not:

1. Select the **Ports** tab next to the terminal.
2. Find port `5173`, labeled **Aircraft digital twin**.
3. Select the globe/open-in-browser icon.

In the application:

1. Open the **Stability** topic.
2. Confirm Stages 1–3 remain installed.
3. Confirm Stage 4 now shows as installed and open **Live Cm–alpha relationship and trim**.
4. Confirm Stages 5–14 have unlocked automatically. You do not need to edit their files.
5. Confirm the Stage 4 displayed result matches your manual reference calculation.
6. Change angle of attack and disturbance inputs and compare the behavior with your predictions.
7. Explain where the governing equation appears in `src/student/physics/trim-response.js` and why the signs and units are correct.

Stage 4 is a live, interactive quasi-static analysis. Its results and plot update as inputs change, but it intentionally does not display run/pause controls or claim to predict a time history.

Stop the development server with **Control+C** in its terminal when you are finished.

## 9. Commit and push the files to your GitHub fork

1. Select the **Source Control** icon in Codespaces.
2. Review the changed-file list. Do not commit unexpected changes to `src/core`, `package.json`, or other instructor-owned files.
3. Enter a commit message such as:

   ```text
   Add Stage 4 trim response
   ```

4. Select **Commit**.
5. Select **Sync Changes** or **Push** and confirm if prompted.
6. Return to your fork on GitHub and refresh the page.
7. Confirm the branch is `main` and the three files appear at their exact paths.
8. Open the **Actions** tab. Confirm the latest **Verify engineering tool** workflow passes.

Your work is not safely stored in your fork until the commit has been pushed and is visible on GitHub.

## 10. Publish and run the simulation from your fork's GitHub Pages site

Do this once for your fork:

1. On your fork's GitHub page, select **Settings**.
2. In the left sidebar under **Code and automation**, select **Pages**.
3. Under **Build and deployment**, set **Source** to **GitHub Actions**.
4. Return to the **Actions** tab.
5. Open **Publish verified aircraft tool**. If it has not started after your push, select **Run workflow**, keep branch `main`, and run it.
6. Wait for both the tests and deployment to pass.
7. Open **Settings → Pages** again and select **Visit site**, or use:

   ```text
   https://YOUR-USERNAME.github.io/intro-aero-digital-twin/
   ```

The Codespaces preview is for development and stops with the Codespace. The GitHub Pages address is the persistent version built from the files pushed to your fork's `main` branch.

## Final submission checklist

- [ ] I worked in my personal fork, not the instructor repository.
- [ ] The prepared repository initially showed Stages 1–3 installed, Stage 4 ready to build, and Stages 5–14 locked.
- [ ] I gave ChatGPT one completed Stage 4 specification.
- [ ] I checked and approved the engineering interpretation before code generation.
- [ ] I created the three files at the exact required paths.
- [ ] I did not edit `src/core` or add dependencies.
- [ ] `npm test` passes.
- [ ] Stage 4 opens in the Stability topic and matches my manual calculation.
- [ ] Stages 5–14 unlocked automatically after Stage 4 was installed.
- [ ] I checked at least one predicted input trend or boundary case.
- [ ] I committed and pushed the work to my fork's `main` branch.
- [ ] The GitHub Actions verification passes.
- [ ] My GitHub Pages simulation opens from my fork.

## If something goes wrong

Use the evidence-based prompts in [`TROUBLESHOOTING.md`](./TROUBLESHOOTING.md). Always include the exact first error, what you expected, what happened, the smallest relevant generated file, and your manual reference calculation.
