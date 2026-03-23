# Buried Treasure Name Generator Spec

## Goal

Generate a large variety of buried treasure names for Minecraft exploration content without producing weak, repetitive names like `Captain's Loot`.

Target:
- Support **60+ distinct treasure names**
- Keep names short enough for UI / loot tables / config use
- Maintain a **coastal / buried / explorer / pirate-adjacent** tone
- Avoid overly goofy or generic outputs

---

## Design Principles

1. **Use patterns, not single fixed phrases**
   - Variety comes from combining multiple structured patterns with word pools.

2. **Prefer artifact-style naming**
   - Good: `The Salt-Stained Coffer`
   - Good: `Blacktide's Cache`
   - Good: `The Drowned Reef Hoard`
   - Weak: `Captain's Loot`
   - Weak: `Pirate Treasure`

3. **Keep outputs readable**
   - Most names should be 2-5 words.
   - Avoid names that are too long or overly fantasy-heavy unless intentionally allowed.

4. **Avoid repetition**
   - Track previously generated names.
   - Optionally reduce repeated use of the same leading words.

5. **Use weighted randomness**
   - Some patterns should appear more often than others.
   - Some words should be rarer to keep them feeling special.

---

## Naming Pattern Set

Use a small set of reusable templates.

### Pattern A — Owner Possession
```txt
[Owner]'s [Object]
```

Examples:
- Blacktide's Cache
- Harrick's Hoard
- Salt Mara's Lockbox

Weight: High

---

### Pattern B — Descriptive Object
```txt
The [Adjective] [Object]
```

Examples:
- The Sunken Coffer
- The Weathered Strongbox
- The Gilded Chest

Weight: High

---

### Pattern C — Place-Based Treasure
```txt
The [Place] [Object]
```

Examples:
- The Reef Cache
- The Mangrove Hoard
- The Shoal Lockbox

Weight: Medium

---

### Pattern D — Adjective + Place + Object
```txt
The [Adjective] [Place] [Object]
```

Examples:
- The Drowned Reef Hoard
- The Salt-Stained Cove Chest
- The Forgotten Mangrove Cache

Weight: Medium

---

### Pattern E — Owner's Lost Object
```txt
[Owner]'s Lost [Object]
```

Examples:
- Calder's Lost Chest
- Gravehook's Lost Coffer
- Old Fen's Lost Vault

Weight: Medium-Low

---

### Pattern F — Object of Owner / Place
```txt
The [Object] of [Owner]
The [Object] of the [Place]
```

Examples:
- The Coffer of Blacktide
- The Lockbox of the Shoal
- The Hoard of Gravehook

Weight: Low

---

## Word Pools

These should be stored separately so they can be expanded easily.

### Objects
```json
[
  "Cache",
  "Hoard",
  "Chest",
  "Strongbox",
  "Lockbox",
  "Coffer",
  "Stash",
  "Vault",
  "Booty",
  "Bounty",
  "Reliquary"
]
```

### Adjectives
```json
[
  "Buried",
  "Sunken",
  "Forgotten",
  "Salt-Stained",
  "Ancient",
  "Hidden",
  "Lost",
  "Weathered",
  "Gilded",
  "Rusted",
  "Blackened",
  "Drifted",
  "Dusty",
  "Sealed",
  "Forsaken",
  "Drowned",
  "Bleached",
  "Stormworn"
]
```

### Owners
```json
[
  "Blacktide",
  "Marrow Jack",
  "Calder",
  "Durnan",
  "Virel",
  "Red Kellan",
  "Storm Garrick",
  "Harrick",
  "Old Fen",
  "Gravehook",
  "Salt Mara",
  "Thorne",
  "Morrow Pike",
  "Edda Vane",
  "Cutter Voss"
]
```

### Places
```json
[
  "Reef",
  "Cove",
  "Mangrove",
  "Dune",
  "Shore",
  "Tide",
  "Lagoon",
  "Shoal",
  "Cliff",
  "Hollow",
  "Inlet",
  "Coast",
  "Bay",
  "Sandbar",
  "Marsh"
]
```

---

## Optional Expanded Pools

Use these only if you want more flavor later.

### Prefix-style titles for owners
```json
[
  "Captain",
  "Old",
  "Red",
  "Storm",
  "Black",
  "Salt"
]
```

### Rare objects
```json
[
  "Idol",
  "Relic",
  "Urn",
  "Ledger",
  "Seal"
]
```

These can be included at low probability.

---

## Constraints / Filtering Rules

Apply validation after generation.

### Hard rules
- No duplicate final names
- No repeated consecutive word meaning
  - Reject examples like `Lost Lost Chest`
- Avoid awkward doubles
  - Reject `The Hidden Hidden Cache`
  - Reject `The Tide Tide Chest`

### Soft rules
- Prefer 2-5 words
- Avoid too many names starting with `The` in a row if generating a batch
- Avoid using the same object more than 2-3 times in close sequence
- Avoid very similar outputs in the same batch
  - Example: `The Sunken Chest` and `The Sunken Coffer` back-to-back

### Tone filters
Reject or avoid:
- `Treasure`
- `Loot`
- `Gold`
- `Riches`

Reason:
These words tend to feel generic and gamey rather than evocative.

---

## Weighted Pattern Example

Use weights to make some patterns more common.

```json
[
  { "id": "owner_object", "weight": 30 },
  { "id": "adj_object", "weight": 30 },
  { "id": "place_object", "weight": 15 },
  { "id": "adj_place_object", "weight": 15 },
  { "id": "owner_lost_object", "weight": 7 },
  { "id": "object_of_owner_or_place", "weight": 3 }
]
```

---

## Suggested Generation Algorithm

### High-level flow

1. Pick a pattern using weighted randomness
2. Fill slots from the relevant word pools
3. Assemble the candidate name
4. Run validation / cleanup
5. Check uniqueness against already used names
6. Retry if invalid
7. Return the valid name

---

## Pseudocode

```txt
function generateTreasureName(usedNames):
    maxAttempts = 50

    for attempt in 1..maxAttempts:
        pattern = weightedRandom(patterns)

        switch pattern:
            case "owner_object":
                owner = random(owners)
                object = random(objects)
                candidate = owner + "'s " + object

            case "adj_object":
                adjective = random(adjectives)
                object = random(objects)
                candidate = "The " + adjective + " " + object

            case "place_object":
                place = random(places)
                object = random(objects)
                candidate = "The " + place + " " + object

            case "adj_place_object":
                adjective = random(adjectives)
                place = random(places)
                object = random(objects)
                candidate = "The " + adjective + " " + place + " " + object

            case "owner_lost_object":
                owner = random(owners)
                object = random(objects)
                candidate = owner + "'s Lost " + object

            case "object_of_owner_or_place":
                object = random(objects)
                if randomChance(0.6):
                    owner = random(owners)
                    candidate = "The " + object + " of " + owner
                else:
                    place = random(places)
                    candidate = "The " + object + " of the " + place

        candidate = normalizeWhitespace(candidate)

        if not passesValidation(candidate):
            continue

        if candidate in usedNames:
            continue

        return candidate

    return fallbackName(usedNames)
```

---

## Validation Pseudocode

```txt
function passesValidation(name):
    bannedWords = ["Treasure", "Loot", "Gold", "Riches"]

    for bannedWord in bannedWords:
        if bannedWord appears in name:
            return false

    words = split(name)

    for i from 0 to length(words)-2:
        if lowercase(words[i]) == lowercase(words[i+1]):
            return false

    if wordCount(name) < 2 or wordCount(name) > 5:
        return false

    return true
```

---

## Fallback Strategy

If generation fails too many times:

1. Use a guaranteed-safe pattern like:
```txt
[Owner]'s [Object]
```

2. If still duplicated, append a rare descriptor:
```txt
Blacktide's Cache
Blacktide's Sealed Cache
Blacktide's Stormworn Cache
```

3. If absolutely necessary, add a roman numeral or hidden ID only internally, not for player-facing text.

---

## JSON-Friendly Config Structure

This is a good format if you want Cursor to build it cleanly.

```json
{
  "patterns": [
    { "id": "owner_object", "template": "{owner}'s {object}", "weight": 30 },
    { "id": "adj_object", "template": "The {adjective} {object}", "weight": 30 },
    { "id": "place_object", "template": "The {place} {object}", "weight": 15 },
    { "id": "adj_place_object", "template": "The {adjective} {place} {object}", "weight": 15 },
    { "id": "owner_lost_object", "template": "{owner}'s Lost {object}", "weight": 7 },
    { "id": "object_of_owner", "template": "The {object} of {owner}", "weight": 2 },
    { "id": "object_of_place", "template": "The {object} of the {place}", "weight": 1 }
  ],
  "pools": {
    "objects": [
      "Cache",
      "Hoard",
      "Chest",
      "Strongbox",
      "Lockbox",
      "Coffer",
      "Stash",
      "Vault",
      "Booty",
      "Bounty",
      "Reliquary"
    ],
    "adjectives": [
      "Buried",
      "Sunken",
      "Forgotten",
      "Salt-Stained",
      "Ancient",
      "Hidden",
      "Lost",
      "Weathered",
      "Gilded",
      "Rusted",
      "Blackened",
      "Drifted",
      "Dusty",
      "Sealed",
      "Forsaken",
      "Drowned",
      "Bleached",
      "Stormworn"
    ],
    "owners": [
      "Blacktide",
      "Marrow Jack",
      "Calder",
      "Durnan",
      "Virel",
      "Red Kellan",
      "Storm Garrick",
      "Harrick",
      "Old Fen",
      "Gravehook",
      "Salt Mara",
      "Thorne",
      "Morrow Pike",
      "Edda Vane",
      "Cutter Voss"
    ],
    "places": [
      "Reef",
      "Cove",
      "Mangrove",
      "Dune",
      "Shore",
      "Tide",
      "Lagoon",
      "Shoal",
      "Cliff",
      "Hollow",
      "Inlet",
      "Coast",
      "Bay",
      "Sandbar",
      "Marsh"
    ]
  },
  "bannedWords": ["Treasure", "Loot", "Gold", "Riches"],
  "minWords": 2,
  "maxWords": 5
}
```

---

## Suggested Implementation Notes for Cursor

Ask Cursor to build:

1. A `generateTreasureName()` function
2. A `generateTreasureNames(count)` batch generator
3. A weighted random helper
4. A validation function
5. Duplicate prevention using a `Set`
6. Optional seed support if deterministic output is desired

### Good implementation split
- `treasure-name-config.ts`
- `treasure-name-generator.ts`
- `treasure-name-validator.ts`

---

## Batch Generation Logic

For generating 60+ names in one go:

```txt
function generateTreasureNames(count):
    usedNames = new Set()
    results = []

    while results.length < count:
        name = generateTreasureName(usedNames)
        if name not in usedNames:
            usedNames.add(name)
            results.push(name)

    return results
```

Optional improvement:
- track recent adjectives / objects used
- penalize recently used terms to improve spread

---

## Example Output Batch

- Blacktide's Cache
- The Sunken Coffer
- The Mangrove Hoard
- Harrick's Lost Chest
- The Drowned Reef Lockbox
- The Weathered Vault
- Gravehook's Hoard
- The Shoal Strongbox
- The Gilded Coffer
- The Lockbox of Blacktide
- Salt Mara's Chest
- The Forgotten Cove Cache
- Old Fen's Lost Vault
- The Rusted Stash
- The Bay Reliquary

---

## Recommendation

For the first proper version:

- Use **6 patterns**
- Use **4 core word pools**
- Ban generic filler words
- Track duplicates
- Add weighted randomness
- Generate batches, not one-offs

That will give enough variety for 60+ buried treasure names while keeping the tone consistent.

---

## Nice Future Upgrades

Later, you could support:
- biome-specific treasure names
- region-specific word pools
- rarity-based naming tiers
- cursed / sacred / royal treasure sets
- pirate vs explorer vs ancient civilization treasure styles

Example:
- swamp treasure pool
- tropical coast treasure pool
- frozen shoreline treasure pool

That would make the naming feel more embedded in the world.
