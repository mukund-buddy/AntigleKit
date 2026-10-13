# Unit Converter

## What it does

Converts values across eight unit families — length, mass/weight, temperature,
volume, area, time, digital storage and speed — with instant results and a
one-tap swap. Every conversion is computed in JavaScript on your device; there
is no API call, no upload and no external conversion service.

Each family converts through a single base unit (metre, kilogram, second, byte,
etc.). Temperature is handled specially because Celsius, Fahrenheit and Kelvin
share no linear factor.

## How to use

1. Pick the **Category** — Length, Mass / weight, Temperature, Volume, Area,
   Time, Digital storage or Speed. The unit lists refresh automatically.
2. Type the **Value** you want to convert. The result updates as you type.
3. Choose **From** and **To** units.
4. Click **Swap** to flip the two units around — handy for reversing a recipe or
   checking the return trip.
5. Click **Copy result** to put the number (with its unit) on your clipboard.

`Enter` in the value box re-runs the conversion explicitly.

## Notable details

- **Digital storage** ships both flavours: KB/MB/GB/TB use decimal powers of
  1000 (what drive sellers quote) while KiB/MiB/GiB/TiB use binary powers of
  1024 (what many operating systems report). The two families convert correctly
  between each other too — 1 GB = 0.9313226 GiB.
- **Temperature** converts through Celsius with exact offsets and slopes:
  °F = °C × 9/5 + 32, K = °C + 273.15. Negative values, e.g. −40 °C = −40 °F,
  work fine.
- **Volume** uses metric plus the US customary set (teaspoons, tablespoons,
  cups, fluid ounces, pints, quarts, gallons). The US gallon differs from the
  imperial one — only the US set is included.
- **Time** treats a month as 30 days and a year as 365 days — fine for
  conversions and estimates, not for date arithmetic.
- Results are formatted to 12 significant digits with trailing zeros trimmed;
  extreme magnitudes switch to exponential notation automatically.

## Privacy note

Everything runs client-side. The numbers you type are never transmitted, stored,
logged or analysed — they live only in the page until you close or reload the
tab.
