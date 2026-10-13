# Password Strength Checker

Score any password and get an instant strength rating, entropy estimate, and concrete suggestions — all computed in your browser so the password never leaves your device.

## What it does

Paste or type a password and the tool returns a 0–100 strength score, an entropy estimate in bits, and the character classes it detected. If the password is weak it also gives you specific feedback on what to improve.

## How to use

1. Open the Password Strength Checker tool.
2. Type or paste a password into the input field.
3. Read the score, entropy, and any tips shown on the right.
4. Tick or untick **Show password** to reveal or hide what you typed.

## Understanding the score

| Score range | Label | Meaning |
|-------------|-------|---------|
| 0–19 | Very weak | Trivially guessable — common password, very short, or only one character class. |
| 20–39 | Weak | Short or low-variety; crackable in seconds to minutes. |
| 40–59 | Fair | Some variety or length; may resist casual guessing but not targeted attacks. |
| 60–79 | Strong | Good length and multiple classes; resistant to most attacks. |
| 80–100 | Very strong | Long, varied, and free of patterns; brute-force resistant. |

The score rewards length and character-class variety, and penalises common passwords, repeated characters (aaa), sequential runs (abc, 123), and anything under 8 characters.

## How entropy is estimated

Entropy is calculated as log2(pool size ^ length), where the pool is the combined set of character classes present (lowercase 26, uppercase 26, digits 10, symbols 33). Each extra bit doubles the number of guesses an attacker must try.

## Privacy note

The check runs entirely in your browser using local JavaScript. Nothing you type is uploaded, stored on a server, or logged — your password never leaves your device.
