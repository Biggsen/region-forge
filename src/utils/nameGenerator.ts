const prefixes = [
  'Aby', 'Ame', 'Anc', 'Ara', 'Ash', 'Ast', 'Aur',
  'Bal', 'Ban', 'Bas', 'Bla', 'Ble', 'Bri', 'Bro', 'Brim', 'Bur',
  'Cal', 'Cen', 'Cob', 'Com', 'Cop', 'Cor', 'Cos', 'Cry', 'Crys', 'Cur',
  'Dae', 'Dar', 'Dem', 'Dia', 'Dra', 'Dus',
  'Eas', 'Eld', 'Eme', 'Enc', 'Ete',
  'Fal', 'Fel', 'For', 'Fro',
  'Gal', 'Gla', 'Gol', 'Gra', 'Grim',
  'Har', 'Hel', 'Hex', 'Hid', 'Hol',
  'Inn', 'Ion', 'Iro',
  'Jad',
  'Kam', 'Kel', 'Kra',
  'Lig', 'Los', 'Low', 'Lun', 'Lux',
  'Mal', 'Mar', 'Met', 'Mid', 'Mor', 'Mort', 'Mys',
  'Neb', 'Nex', 'Nor', 'Nyx',
  'Oba', 'Obs', 'Ony', 'Oth', 'Out',
  'Plu', 'Pro', 'Pyra', 'Pyro',
  'Quae', 'Qua',
  'Rav', 'Rex', 'Rub', 'Rune',
  'Sac', 'Sap', 'Sha', 'Sil', 'Ska', 'Sol', 'Soli', 'Ste', 'Sum',
  'Tal', 'Thu', 'Tin', 'Top', 'Tur',
  'Umb', 'Umbra', 'Upp',
  'Vaal', 'Val', 'Ven', 'Verd', 'Vex', 'Vor',
  'Whi', 'Wes', 'Wyrm',
  'Xer',
  'Yll',
  'Zan', 'Zeph', 'Zin', 'Zor'
]

const suffixes = [
  'ado', 'ania', 'area', 'aria',
  'badlands', 'basin', 'bastion', 'bay', 'bluff', 'bounds',
  'calia', 'canyon', 'castle', 'citadel', 'cliff', 'cove', 'crest', 'crown', 'crossing',
  'depths', 'demesne', 'descent', 'domain', 'donia',
  'empire', 'enclave', 'enia', 'eria', 'esi', 'ethia', 'expanse',
  'falls', 'field', 'fissure', 'forest', 'fort', 'frontier',
  'gate', 'glade', 'grove',
  'harbor', 'haven', 'heartland', 'heath', 'highlands', 'hills', 'hold', 'hollow',
  'ithia',
  'keep', 'kingdom', 'kora',
  'lake', 'land', 'landia', 'lara', 'lowlands',
  'marches', 'marsh', 'meadow', 'moor', 'mountains',
  'nara', 'noria',
  'onia', 'oria', 'outpost',
  'palace', 'passage', 'peak', 'plains', 'plateau', 'pond', 'port', 'province',
  'quarter',
  'ravine', 'reach', 'realm', 'region', 'reliquary', 'reliquum', 'refuge', 'ridge', 'rift', 'rise', 'river',
  'sanctuary', 'sanctum', 'scar', 'seat', 'shelf', 'shire', 'spring', 'span', 'steppes', 'stream', 'stretch', 'summit', 'swamp',
  'territory', 'threshold', 'throne', 'tower', 'tos',
  'uria',
  'vale', 'valley', 'vara', 'verge', 'vos',
  'ward', 'wastes', 'watch', 'wilds', 'wound',
  'zone'
]

const themes = [
  'Ancient', 'Aurora', 'Bard', 'Basilisk', 'Bear', 'Blessed',
  'Cartographer', 'Centaur', 'Champion', 'Chimera', 'Chronicler', 'Comet', 'Conqueror', 'Crown', 'Crystal', 'Cursed',
  'Dawn', 'Destiny', 'Divine', 'Dragon', 'Dusk', 'Dwarf',
  'Eagle', 'Earth', 'Echo', 'Eclipse', 'Elf', 'Ember', 'Eternal', 'Exile', 'Explorer',
  'Fate', 'Fire', 'Frost',
  'Giant', 'Glacier', 'Gorgon', 'Griffin',
  'Hawk', 'Herald', 'Holy', 'Horizon', 'Hunter', 'Hydra',
  'Ice', 'Inferno',
  'Knight',
  'Legacy', 'Leviathan', 'Light', 'Lion', 'Lightning',
  'Mage', 'Magic', 'Maelstrom', 'Midnight', 'Minotaur', 'Mist', 'Monk', 'Moon', 'Mystic', 'Myth',
  'Nomad', 'Noon',
  'Omen', 'Oracle', 'Owl',
  'Paladin', 'Pathfinder', 'Pegasus', 'Phoenix', 'Pilgrim', 'Priest', 'Profane',
  'Ranger', 'Raven', 'Relic',
  'Sacred', 'Sage', 'Sentinel', 'Seer', 'Serpent', 'Shadow', 'Silence', 'Sovereign', 'Star', 'Stillness', 'Storm', 'Sunrise', 'Sunset',
  'Tempest', 'Throne', 'Thunder', 'Tide', 'Twilight',
  'Unicorn',
  'Void', 'Voyager',
  'Warden', 'Wanderer', 'Warrior', 'Watcher', 'Water', 'Wind', 'Wizard', 'Wolf',
  'Wyvern',
  'Zenith'
]

const connectors = ['of', 'the', 'in', 'at', 'by', 'near', 'beyond', 'within', 'under', 'over']

const complexSyllables = [
  'ame', 'anc', 'ara',
  'bal', 'ble', 'bro', 'bur',
  'cob', 'cop', 'cry', 'cur',
  'da', 'dar', 'dia', 'do', 'dra', 'drae',
  'eme', 'enc', 'ete',
  'fen', 'for', 'fro',
  'gol', 'gra', 'gyr',
  'hal', 'hid', 'hol',
  'iro', 'isk',
  'jad', 'jol',
  'ka', 'kael', 'kel', 'ko', 'kora', 'kyr',
  'la', 'li', 'lir', 'lo', 'lun',
  'ma', 'mar', 'mo', 'mor', 'mu', 'myn',
  'na', 'nar', 'nor', 'no',
  'obs', 'ony',
  'plu', 'pro',
  'qua', 'qor',
  'ra', 'rav', 'rin', 'ro', 'ryl',
  'sa', 'sac', 'sap', 'sar', 'sen', 'sek', 'sha', 'sil', 'ste',
  'tho', 'thra', 'tin', 'to', 'tor', 'tyr',
  'uln',
  'va', 'vak', 'val', 'vel', 'vo', 'vor', 'vu',
  'whi', 'wyr',
  'xa', 'xel',
  'yi', 'yra',
  'ze', 'zin', 'zor', 'zyn', 'zo'
]

// Medieval village name generator - Clean historical place names
const namePrefixes = [
  'Ram', 'Nar', 'Aln', 'Ilf', 'Tim', 'Aber', 'Auch', 'Wolf', 'Wind', 'Kel',
  'Leur', 'Bor', 'Por', 'Aqu', 'Brad', 'Gray', 'Rother', 'Abing', 'Wave',
  'North', 'South', 'East', 'West', 'Little', 'Great', 'Old', 'New', 'High',
  'Low', 'Upper', 'Lower', 'Middle', 'Far', 'Near', 'Long', 'Short', 'Broad',
  'Narrow', 'Deep', 'Shallow', 'Wide', 'Tiny', 'Big', 'Small', 'Black', 'White',
  'Red', 'Green', 'Blue', 'Golden', 'Silver', 'Iron', 'Stone', 'Wood', 'Water',
  'Ash', 'Oak', 'Elm', 'Beech', 'Pine', 'Cedar', 'Maple', 'Birch', 'Willow', 'Hazel',
  'Thorn', 'Bramble', 'Heather', 'Fern', 'Moss', 'Ivy', 'Rose', 'Lily', 'Daisy', 'Violet',
  'Fox', 'Hare', 'Deer', 'Stag', 'Hawk', 'Eagle', 'Raven', 'Crow', 'Swan', 'Duck',
  'Badger', 'Otter', 'Weasel', 'Mole', 'Hedgehog', 'Squirrel', 'Mouse', 'Rat', 'Cat', 'Dog',
  'Cold', 'Warm', 'Bright', 'Dark', 'Clear', 'Misty', 'Foggy', 'Stormy', 'Calm', 'Wild',
  'Swift', 'Slow', 'Quick', 'Steady', 'Gentle', 'Rough', 'Smooth', 'Sharp', 'Blunt', 'Soft',
  'Fair', 'Foul', 'Sweet', 'Sour', 'Fresh', 'Stale', 'Clean', 'Dirty', 'Rich', 'Poor',
  'Happy', 'Sad', 'Merry', 'Gloomy', 'Cheerful', 'Somber', 'Lively', 'Quiet', 'Busy', 'Still',
  'Bla', 'Whi', 'Re', 'Gre', 'Blu', 'Gol', 'Sil', 'Iro', 'Sto', 'Woo', 'Wat',
  'As', 'Oa', 'El', 'Be', 'Pi', 'Ce', 'Ma', 'Bi', 'Wi', 'Ha',
  'Tho', 'Bra', 'Hea', 'Fe', 'Mo', 'Iv', 'Ro', 'Li', 'Da', 'Vi',
  'Fo', 'Ha', 'De', 'Sta', 'Haw', 'Eag', 'Rav', 'Cro', 'Swa', 'Du',
  'Bad', 'Ott', 'Wea', 'Mol', 'Hed', 'Squ', 'Mou', 'Ra', 'Ca', 'Do'
]

const nameRoots = [
  'horn', 'wick', 'mouth', 'combe', 'ford', 'ston', 'uthven', 'vercraig',
  'dinny', 'pine', 'rip', 'd', 'bost', 'oughton', 'folk', 'thaethwy', 'arine',
  'ford', 'cott', 'hithe', 'don', 'meet', 'brook', 'bruk', 'dale', 'bridge', 'mill',
  'church', 'cross', 'stone', 'wood', 'field', 'meadow', 'hill', 'moor',
  'marsh', 'fen', 'heath', 'ridge', 'valley', 'spring', 'well', 'pond',
  'lake', 'river', 'stream', 'creek', 'bay', 'harbor', 'port', 'town',
  'village', 'hamlet', 'stead', 'wick', 'by', 'thorpe', 'ton', 'ham', 'ley',
  'den', 'hurst', 'combe', 'bury', 'castle', 'tower', 'keep', 'hall', 'manor',
  'grange', 'farm', 'cottage', 'house', 'inn', 'tavern', 'market', 'fair',
  'gate', 'wall', 'bank', 'side', 'end', 'head', 'foot', 'top', 'bottom',
  'cliff', 'peak', 'summit', 'crest', 'slope', 'bank', 'shore', 'shor', 'beach', 'coast', 'island',
  'peninsula', 'cape', 'point', 'spit', 'bar', 'reef', 'shoal', 'sand', 'gravel', 'clay',
  'chalk', 'flint', 'granite', 'marble', 'slate', 'limestone', 'sandstone', 'basalt', 'obsidian', 'quartz',
  'copper', 'tin', 'lead', 'zinc', 'nickel', 'cobalt', 'manganese', 'chromium', 'tungsten', 'molybdenum',
  'amber', 'jade', 'opal', 'agate', 'onyx', 'jasper', 'carnelian', 'chalcedony', 'malachite', 'azurite',
  'thistle', 'nettle', 'dock', 'plantain', 'dandelion', 'clover', 'vetch', 'trefoil', 'sorrel', 'chickweed',
  'bracken', 'reed', 'rush', 'sedge', 'grass', 'wheat', 'barley', 'oats', 'rye', 'corn',
  'apple', 'pear', 'plum', 'cherry', 'berry', 'nut', 'acorn', 'chestnut', 'walnut', 'hazelnut',
  'yerd', 'cort', 'lene', 'shor', 'bruk', 'fild', 'meed', 'hil', 'mor', 'marsh',
  'fen', 'heth', 'ridg', 'valy', 'sprng', 'wel', 'pond', 'lak', 'rivr', 'strem',
  'crik', 'bay', 'harb', 'prt', 'twn', 'vill', 'hamlt', 'sted', 'wik', 'bi', 'thorp', 'ton', 'ham', 'ley',
  'den', 'hurst', 'comb', 'buri', 'castl', 'towr', 'kep', 'hal', 'manr', 'grang', 'frm', 'cottg', 'hous', 'in', 'taver', 'markt', 'fayr', 'gat', 'wal', 'ban', 'sid', 'end', 'hed', 'fut', 'top', 'botm'
]

const nameSuffixes = [
  'by', 'ton', 'ham', 'wick', 'ford', 'bridge', 'mill', 'church', 'cross',
  'stone', 'wood', 'field', 'meadow', 'hill', 'moor', 'marsh', 'fen', 'heath',
  'ridge', 'valley', 'spring', 'well', 'pond', 'lake', 'river', 'stream',
  'creek', 'bay', 'harbor', 'port', 'town', 'village', 'hamlet', 'stead',
  'thorpe', 'ley', 'den', 'hurst', 'combe', 'bury', 'castle', 'tower', 'keep',
  'hall', 'manor', 'grange', 'farm', 'cottage', 'house', 'inn', 'tavern',
  'market', 'fair', 'gate', 'wall', 'bank', 'side', 'end', 'head', 'foot',
  'top', 'bottom', 'mouth', 'combe', 'ford', 'wick', 'by', 'ton', 'ham',
  'land', 'shire', 'mere', 'water', 'pool', 'beck', 'burn', 'gill', 'hope', 'law',
  'crag', 'scar', 'edge', 'side', 'way', 'path', 'road', 'street', 'lane', 'lene', 'alley',
  'yard', 'yerd', 'close', 'court', 'cort', 'square', 'place', 'row', 'terrace', 'avenue', 'drive', 'crescent',
  'park', 'garden', 'orchard', 'grove', 'copse', 'spinney', 'thicket', 'brake', 'shaw', 'holt',
  'fold', 'stall', 'barn', 'shed', 'store', 'warehouse', 'shop', 'market', 'fair', 'mart',
  'forge', 'furnace', 'kiln', 'oven', 'hearth', 'fire', 'flame', 'ember', 'spark', 'glow',
  'fild', 'meed', 'hil', 'mor', 'marsh', 'fen', 'heth', 'ridg', 'valy', 'sprng', 'wel', 'pond', 'lak', 'rivr', 'strem',
  'crik', 'bay', 'harb', 'prt', 'twn', 'vill', 'hamlt', 'sted', 'wik', 'bi', 'thorp', 'ton', 'ham', 'ley',
  'den', 'hurst', 'comb', 'buri', 'castl', 'towr', 'kep', 'hal', 'manr', 'grang', 'frm', 'cottg', 'hous', 'in', 'taver', 'markt', 'fayr', 'gat', 'wal', 'ban', 'sid', 'end', 'hed', 'fut', 'top', 'botm'
]

const authenticVillageNames = [
  'Carniga', 'Flauch', 'Weimich', 'Sloat', 'Maceria', 'Bracken', 'Thornby',
  'Marshwood', 'Stonebridge', 'Windermere', 'Blackwater', 'Whitehaven',
  'Redcliffe', 'Greenfield', 'Bluebell', 'Goldenbrook', 'Silverdale',
  'Ironforge', 'Woodhaven', 'Waterford', 'Northwich', 'Southport',
  'Eastbourne', 'Westminster', 'Littlehampton', 'Great Yarmouth',
  'Oldham', 'Newcastle', 'Highbury', 'Lowestoft', 'Upper Heyford',
  'Lower Hutt', 'Middlewich', 'Farnham', 'Nearby', 'Longford',
  'Shortwood', 'Broadstairs', 'Narrowgate', 'Deepdale', 'Shallowford',
  'Widecombe', 'Tinybrook', 'Bigbury', 'Smallbridge', 'Ramshorn',
  'Alnwick', 'Ilfracombe', 'Wolford', 'Timeston', 'Aberuthven',
  'Travercraig', 'Auchendinny', 'Wolfpine', 'Windrip', 'Keld',
  'Leurbost', 'Boroughton', 'Narfolk', 'Porthaethwy', 'Aquarine',
  'Bradford', 'Graycott', 'Rotherhithe', 'Abingdon', 'Wavemeet',
  'Ashford', 'Oakdale', 'Elmwood', 'Beecham', 'Pinehurst', 'Cedarbrook', 'Mapleton', 'Birchfield', 'Willowby', 'Hazelton',
  'Thornhill', 'Brambleford', 'Heatherfield', 'Fernbrook', 'Mossley', 'Ivybridge', 'Rosewood', 'Lilydale', 'Daisyfield', 'Violetbank',
  'Foxcroft', 'Harefield', 'Deerbrook', 'Stagford', 'Hawksworth', 'Eaglebrook', 'Ravencliff', 'Crowborough', 'Swansea', 'Duckmarsh',
  'Badgerford', 'Otterburn', 'Weaselton', 'Molehill', 'Hedgeford', 'Squirrelton', 'Mousehole', 'Rathole', 'Catford', 'Dogwood',
  'Coldbrook', 'Warmley', 'Brighton', 'Darkwater', 'Clearwell', 'Mistley', 'Foggybottom', 'Stormbridge', 'Calmwater', 'Wildwood',
  'Swiftford', 'Slowbrook', 'Quickley', 'Steadyford', 'Gentlebrook', 'Roughwater', 'Smoothley', 'Sharphill', 'Bluntford', 'Softwater',
  'Fairfield', 'Foulbridge', 'Sweetwater', 'Sourbrook', 'Freshford', 'Stalebridge', 'Cleanwater', 'Dirtybrook', 'Richford', 'Poorwater',
  'Happybrook', 'Sadford', 'Merrywater', 'Gloomybrook', 'Cheerford', 'Somberwater', 'Livelybrook', 'Quietford', 'Busywater', 'Stillbrook',
  'Amberford', 'Jadebrook', 'Opalwater', 'Agateford', 'Onyxbrook', 'Jasperwater', 'Carnelianford', 'Chalcedonybrook', 'Malachitewater', 'Azuriteford',
  'Thistlebrook', 'Nettleford', 'Dockwater', 'Plantainbrook', 'Dandelionford', 'Cloverwater', 'Vetchbrook', 'Trefoilford', 'Sorrelwater', 'Chickweedbrook',
  'Brackenford', 'Reedwater', 'Rushbrook', 'Sedgeford', 'Grasswater', 'Wheatbrook', 'Barleyford', 'Oatswater', 'Ryebrook', 'Cornford',
  'Applebrook', 'Pearford', 'Plumwater', 'Cherrybrook', 'Berryford', 'Nutwater', 'Acornbrook', 'Chestnutford', 'Walnutwater', 'Hazelnutbrook'
]

const quirkyElements = [
  'Whispering', 'Laughing', 'Sleeping', 'Dancing', 'Singing', 'Weeping',
  'Hidden', 'Forgotten', 'Ancient', 'Mysterious', 'Enchanted', 'Blessed',
  'Cursed', 'Golden', 'Silver', 'Iron', 'Copper', 'Bronze', 'Crystal',
  'Emerald', 'Ruby', 'Sapphire', 'Amber', 'Jade', 'Pearl', 'Diamond'
]

const animalElements = [
  'Fox', 'Wolf', 'Bear', 'Deer', 'Hare', 'Rabbit', 'Owl', 'Eagle', 'Hawk',
  'Crow', 'Raven', 'Swan', 'Duck', 'Goose', 'Horse', 'Cow', 'Sheep', 'Pig',
  'Cat', 'Dog', 'Mouse', 'Rat', 'Snake', 'Fish', 'Frog', 'Toad', 'Bee',
  'Butterfly', 'Dragon', 'Phoenix', 'Griffin', 'Unicorn'
]

// Nether-specific naming elements with otherworldly/eldritch themes (no nether blocks)
const netherPrefixes = [
  // Alien/Otherworldly prefixes
  'Xyr', 'Mor', 'Khor', 'Azr', 'Vex', 'Nyx', 'Zor', 'Kra', 'Dem', 'Hel',
  'Xyrrath', 'Mor\'gath', 'Khorvus', 'Azrak', 'Vexrath', 'Nyxmar', 'Zorvath', 'Kra\'thul', 'Dem\'rath', 'Hel\'gath',
  'Chth', 'Nihil', 'Ebon', 'Umbral', 'Void', 'Rift', 'Abyss', 'Chaos', 'Doom', 'Grim',
  'Chthonic', 'Voidscar', 'Riftmarrow', 'Abyssal', 'Chaotic', 'Doomed', 'Grimdark',
  // Dark medieval/cursed vibes
  'Bleak', 'Ashen', 'Black', 'Infernal', 'Scourged', 'Bloodfire', 'Hollow', 'Oblivion', 'Withered',
  'Cursed', 'Forsaken', 'Damned', 'Blighted', 'Corrupted', 'Tainted', 'Defiled', 'Desecrated',
  'Ancient', 'Forgotten', 'Lost', 'Abandoned', 'Ruined', 'Decayed', 'Rotting', 'Festering',
  'Cruel', 'Vile', 'Wicked', 'Malicious', 'Sinister', 'Malevolent', 'Nefarious', 'Diabolical',
  // Traditional nether elements (no blocks)
  'Infer', 'Hell', 'Fire', 'Ash', 'Ember', 'Blaze', 'Soul', 'Wither', 'Nether',
  'Crim', 'Warp', 'Dark', 'Shadow', 'Bone', 'Skull', 'Death', 'Ruin', 'Scorch', 'Burn', 'Flame', 'Magma', 'Lava',
  'Molten', 'Smoke', 'Fume', 'Cinder', 'Char', 'Coal', 'Red', 'Orange', 'Crimson', 'Warped'
]

const netherSuffixes = [
  // Otherworldly / eldritch
  'Abyss', 'Abyssal', 'Rift', 'Void', 'Null', 'Scar', 'Coil', 'Expanse', 'Sprawl',
  'Depths', 'Deep', 'Mire', 'Forge', 'Marrow', 'Nexus', 'Gate', 'Portal',
  'Breach', 'Threshold', 'Terminus', 'End', 'Core', 'Heart', 'Soul',
  'Chasm', 'Pit', 'Hollow', 'Sink', 'Vortex', 'Maelstrom', 'Convergence',

  // Dark medieval / cursed
  'Maw', 'Dominion', 'Crucible', 'Descent', 'Bastion', 'Veins', 'Reach', 'Marches',
  'Wasteland', 'Barrens', 'Waste', 'Ruins', 'Graveyard', 'Cemetery', 'Ossuary',
  'Dungeon', 'Prison', 'Gaol', 'Cells',
  'Torture', 'Suffering', 'Torment', 'Agony', 'Despair',
  'Penance', 'Judgement', 'Condemnation', 'Exile', 'Damnation',
  'Wrath', 'Retribution', 'Lament', 'Anguish', 'Misery',
  'Plague', 'Pestilence', 'Blight', 'Bane', 'Doom', 'Ruin', 'Destruction',
  'Decay', 'Corruption', 'Taint', 'Rot', 'Withering',

  // World / plane descriptors
  'Realm', 'Domain', 'Land', 'World', 'Dimension', 'Plane', 'Underreach',

  // Fire / infernal (no blocks)
  'Fire', 'Flame', 'Ember', 'Ash', 'Cinder', 'Smoke', 'Fume', 'Lava', 'Magma',
  'Endfire', 'Dead Flame',

  // Structures / traversal
  'Fortress', 'Stronghold', 'Citadel', 'Keep', 'Tower', 'Battlements', 'Ramparts', 'Walls',
  'Catacombs', 'Crypts', 'Tombs', 'Graves', 'Mausoleums',
  'Halls', 'Chambers', 'Vaults', 'Archives', 'Antechambers',
  'Corridors', 'Tunnels', 'Passages', 'Causeways', 'Bridges',
  'Watchtowers', 'Spires', 'Pylons', 'Obelisks',

  // Terrain / hostile geography
  'Desert', 'Heights', 'Peaks', 'Valleys', 'Caverns',
  'Caldera', 'Fissures', 'Vents', 'Basins', 'Shelves',
  'Ledges', 'Overhangs', 'Pillars', 'Columns'
]

const netherThemes = [
  // Eldritch / named forces
  'Xyrrath', 'Xalreth', 'Chthonic', 'Mor\'gath', 'Nihil', 'Ebon', 'Umbral',
  'Voidscar', 'Riftmarrow', 'Khorvus', 'Azrak', 'Nyxar', 'Vorath', 'Zeraph',
  'Kalthuun',

  // Definitive entities
  'The Chthonic', 'The Nihil', 'The Umbral', 'The Voidscar', 'The Riftmarrow',
  'The Ebon', 'The Azrak', 'The Null', 'The Unseen', 'The Nameless',
  'The Red Wake', 'The Black Deep', 'The Last Scar', 'The Shattered',

  // Dark medieval / cursed
  'The Bleak', 'The Ashen', 'The Black', 'The Infernal', 'The Scourged',
  'The Bloodfire', 'The Hollow', 'The Oblivion', 'The Withered',
  'The Cursed', 'The Forsaken', 'The Damned', 'The Blighted',
  'The Corrupted', 'The Tainted', 'The Defiled', 'The Desecrated',

  // Age / decay
  'The Ancient', 'The Forgotten', 'The Lost', 'The Abandoned',
  'The Ruined', 'The Decayed', 'The Rotting', 'The Festering',

  // Moral / intent
  'The Cruel', 'The Vile', 'The Wicked', 'The Malicious',
  'The Sinister', 'The Malevolent', 'The Nefarious', 'The Diabolical',
  'The Condemned', 'The Judged', 'The Punished', 'The Exiled',
  'The Unforgiven', 'The Broken', 'The Shackled',
  'The Screaming', 'The Weeping', 'The Howling',
  'The Endless', 'The Unyielding', 'The Consuming',

  // Abstract suffering
  'Woe', 'Despair', 'Torment', 'Agony', 'Suffering',
  'Plague', 'Pestilence', 'Blight', 'Curse', 'Bane',

  // Infernal descriptors
  'Infernal', 'Hellish', 'Fiery', 'Burning', 'Scorching',
  'Blazing', 'Searing', 'Smouldering', 'Charred',
  'Blistering', 'Fuming', 'Raging', 'Seething', 'Boiling',
  'Cracked', 'Bleeding', 'Blackened',

  // Fire / ash concepts
  'Molten', 'Lava', 'Magma', 'Ash', 'Ember', 'Cinder',
  'Smoke', 'Fume', 'Ashfall', 'Afterburn',
  'Cinderwake', 'Graveheat', 'Endfire', 'Last Ember', 'Dead Flame',

  // Existential / void
  'Soul', 'Wither', 'Death', 'Doom', 'Chaos',
  'Void', 'Abyss', 'Darkness', 'Shadow',
  'Oblivion', 'Entropy', 'Ruinous',

  // Desolation
  'Grim', 'Desolate', 'Barren', 'Wasted', 'Ruined',

  // Nether-aligned (no blocks)
  'Crimson', 'Warped', 'Nether', 'Hell', 'Inferno',
  'Purgatory', 'Limbo',

  // Place-identifiers
  'Fortress', 'Bastion', 'Citadel', 'Stronghold',
  'Sanctum', 'Reliquary', 'Throne', 'Seat', 'Crown',
  'March', 'Depth', 'Depths', 'Below', 'Underrealm',
  'Waste', 'Desert', 'Barrens'
]

export function generateMedievalName(): string {
  const random = Math.random()
  
  // Different name patterns with different probabilities
  if (random < 0.3) {
    // Pattern: "Prefix + Suffix" (e.g., "Dramonia", "Mystaria") - 30%
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)]
    return `${prefix}${suffix}`
  } else if (random < 0.55) {
    // Pattern: "Prefix + Syllable + Suffix" (e.g., "Drakamonia", "Myslaria") - 25%
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
    const syllable = complexSyllables[Math.floor(Math.random() * complexSyllables.length)]
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)]
    return `${prefix}${syllable}${suffix}`
  } else if (random < 0.75) {
    // Pattern: "Theme + Suffix" (e.g., "Dragonland", "Crystalrealm") - 20%
    const theme = themes[Math.floor(Math.random() * themes.length)]
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)]
    return `${theme}${suffix}`
  } else if (random < 0.95) {
    // Pattern: Complex multi-syllable name (e.g., "Kamalidumasana") - 20%
    const syllableCount = Math.floor(Math.random() * 2) + 3 // 3-4 syllables
    let complexName = ''
    for (let i = 0; i < syllableCount; i++) {
      const syllable = complexSyllables[Math.floor(Math.random() * complexSyllables.length)]
      complexName += syllable
    }
    // Capitalize first letter
    return complexName.charAt(0).toUpperCase() + complexName.slice(1)
  } else {
    // Pattern: "Theme + of + Theme" (e.g., "Dragon of Fire") - 5%
    const theme1 = themes[Math.floor(Math.random() * themes.length)]
    const theme2 = themes[Math.floor(Math.random() * themes.length)]
    return `${theme1} of ${theme2}`
  }
}

export function generateVillageName(): string {
  const random = Math.random()
  
  if (random < 0.4) {
    // Use authentic village names (already capitalized)
    return authenticVillageNames[Math.floor(Math.random() * authenticVillageNames.length)]
  } else if (random < 0.7) {
    // Combine prefix + root (clean, no internal caps)
    const prefix = namePrefixes[Math.floor(Math.random() * namePrefixes.length)]
    const root = nameRoots[Math.floor(Math.random() * nameRoots.length)]
    const combinedName = `${prefix}${root}`
    return combinedName.charAt(0).toUpperCase() + combinedName.slice(1)
  } else {
    // Combine root + suffix (clean, no internal caps)
    const root = nameRoots[Math.floor(Math.random() * nameRoots.length)]
    const suffix = nameSuffixes[Math.floor(Math.random() * nameSuffixes.length)]
    const combinedName = `${root}${suffix}`
    return combinedName.charAt(0).toUpperCase() + combinedName.slice(1)
  }
}

export function generateNetherName(): string {
  const random = Math.random()
  
  // Different name patterns with different probabilities (no pre-made names)
  if (random < 0.5) {
    // Pattern: "NetherPrefix + NetherSuffix" (e.g., "Xyrrath Abyss", "Mor'gath Expanse")
    const prefix = netherPrefixes[Math.floor(Math.random() * netherPrefixes.length)]
    const suffix = netherSuffixes[Math.floor(Math.random() * netherSuffixes.length)]
    return `${prefix} ${suffix}`
  } else {
    // Pattern: "NetherTheme + of + NetherTheme" (e.g., "Fire of Doom", "Void of Chaos")
    const theme1 = netherThemes[Math.floor(Math.random() * netherThemes.length)]
    const theme2 = netherThemes[Math.floor(Math.random() * netherThemes.length)]
    return `${theme1} of ${theme2}`
  }
}

// End dimension naming - ethereal, void/space themed (Prefix + Suffix)
const endPrefixes = [
  'Eshara', 'Vaelith', 'Korveth', 'Noxara', 'Zelphar', 'Cyrastra', 'Orenthyl', 'Velkor', 'Aelith', 'Vireth',
  'Thalorim', 'Ilyra', 'Serathis', 'Nerovar', 'Vaelorin', 'Kelthara', 'Otheryn', 'Lunareth', 'Elaris', 'Myreth',
  'Xylaris', 'Nytheron', 'Vespera', 'Aetheris', 'Zephyron', 'Caelith', 'Umbrath', 'Stellara', 'Nocthyr', 'Solareth',
  'Ethereon', 'Voidara', 'Astralis', 'Chorion', 'Endrith', 'Nexaris', 'Orionth', 'Polaris', 'Quasara', 'Rigelth'
]

const endSuffixes = [
  'Verge', 'Silence', 'Rift', 'Span', 'Meridian', 'Drift', 'Reach', 'Halo', 'Belt', 'Horizon',
  'Expanse', 'Void', 'Threshold', 'Gate', 'Shard', 'Vestige', 'Echo', 'Gleam', 'Pulse', 'Veil'
]

export function generateEndName(): string {
  const prefix = endPrefixes[Math.floor(Math.random() * endPrefixes.length)]
  const suffix = endSuffixes[Math.floor(Math.random() * endSuffixes.length)]
  return `${prefix} ${suffix}`
}

// Main functions that choose between overworld, nether, and end based on dimension
export function generateRegionName(dimension: 'overworld' | 'nether' | 'end'): string {
  if (dimension === 'nether') return generateNetherName()
  if (dimension === 'end') return generateEndName()
  return generateMedievalName()
}

export function generateVillageNameByWorldType(dimension: 'overworld' | 'nether' | 'end'): string {
  // Villages don't exist in the nether or end, so always use overworld village names
  return generateVillageName()
}

const junglePyramidAdjectives = [
  'Verdant', 'Emerald', 'Jade', 'Mossbound', 'Overgrown', 'Ancient', 'Sunken',
  'Hidden', 'Forgotten', 'Silent', 'Drowned', 'Rootbound', 'Canopy', 'Verdigris', 'Rainworn'
]
const junglePyramidRuins = [
  'Temple', 'Sanctum', 'Shrine', 'Pyramid', 'Vault', 'Hall', 'Reliquary',
  'Sanctuary', 'Altar', 'Ziggurat'
]
const junglePyramidEntities = [
  'Jaguar', 'Serpent', 'Sun', 'Moon', 'Canopy', 'Rain', 'Idol',
  'Spirit', 'Guardian', 'Watcher', 'Oracle'
]
const junglePyramidAncientNames = [
  'Xalora', 'Teshara', 'Icarun', 'Zarathi', 'Kethra', 'Ossaru',
  'Velkar', 'Mireth', 'Thalara', 'Zeruun'
]

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function generateJunglePyramidName(): string {
  const patterns = [
    () => `The ${pick(junglePyramidAdjectives)} ${pick(junglePyramidRuins)}`,
    () => `Temple of the ${pick(junglePyramidAdjectives)} ${pick(junglePyramidEntities)}`,
    () => `The ${pick(junglePyramidRuins)} of ${pick(junglePyramidAncientNames)}`,
    () => `The ${pick(junglePyramidEntities)} ${pick(junglePyramidRuins)}`
  ]
  return pick(patterns)()
}

const iglooPrefixes = [
  'Frost', 'Ice', 'Snow', 'Glacier', 'Drift', 'Blizzard', 'Polar', 'Arctic',
  'White', 'Crystal', 'Frozen', 'Shiver', 'North', 'Cold', 'Hearth'
]
const iglooSuffixes = [
  'Rest', 'Hollow', 'Den', 'Lodge', 'Shelter', 'Refuge', 'Haven', 'Nook',
  'Peak', 'Vale', 'Ridge', 'Cave', 'Dome', 'Hall', 'Chamber'
]

export function generateIglooName(): string {
  const prefix = iglooPrefixes[Math.floor(Math.random() * iglooPrefixes.length)]
  const suffix = iglooSuffixes[Math.floor(Math.random() * iglooSuffixes.length)]
  return `${prefix} ${suffix}`
}

type DesertPyramidPattern = (pools: DesertPyramidPools) => string

interface DesertPyramidPools {
  desertMaterial: string[]
  adjectives: string[]
  structures: string[]
  abstract: string[]
  curated: string[]
}

const desertPyramidPools: DesertPyramidPools = {
  desertMaterial: ['Sand', 'Dune', 'Dust', 'Amber', 'Silt', 'Sun', 'Scorch', 'Ochre', 'Bone', 'Gilded'],
  adjectives: ['Ancient', 'Buried', 'Silent', 'Forgotten', 'Sealed', 'Sunken', 'Hollow', 'Bleached', 'Veiled'],
  structures: ['Pyramid', 'Tomb', 'Vault', 'Sanctum', 'Temple', 'Crypt', 'Sepulcher', 'Reliquary', 'Mausoleum'],
  abstract: ['Silence', 'Heat', 'Ash', 'Dunes', 'Horizon', 'Sun', 'Dust', 'Bones', 'Time'],
  curated: ['Amber Crypt', 'Scorch Hall', 'Dust Vault', 'Dune Sanctum', 'Bone Pyramid']
}

const desertPyramidPatterns: DesertPyramidPattern[] = [
  (p) => `${pick(p.desertMaterial)} ${pick(p.structures)}`,
  (p) => `${pick(p.adjectives)} ${pick(p.structures)}`,
  (p) => `${pick(p.structures)} of ${pick(p.abstract)}`,
  (p) => `${pick(p.desertMaterial)} ${pick(p.structures)}`
]

export function generateDesertPyramidName(): string {
  if (Math.random() < 0.15) {
    return pick(desertPyramidPools.curated)
  }

  const pattern = pick(desertPyramidPatterns)
  return pattern(desertPyramidPools)
}

export function generateDesertPyramidNames(count: number): string[] {
  const results = new Set<string>()

  while (results.size < count) {
    results.add(generateDesertPyramidName())
  }

  return Array.from(results)
}

// --- Desert well name generator (spec: tasks/desert-well-name-generator.ts) ---

const desertWellWordPools = {
  heat: [
    'Sun', 'Dune', 'Sand', 'Ember', 'Scorch', 'Sirocco', 'Dust', 'Arid', 'Blaze', 'Noon', 'Drift', 'Grit'
  ],
  relief: [
    'Rest', 'Refuge', 'Respite', 'Haven', 'Shelter', 'Pause', 'Mercy', 'Relief', 'Sanctuary'
  ],
  structures: ['Well', 'Cistern', 'Basin', 'Spring', 'Reservoir', 'Hollow'],
  adjectives: [
    'Quiet', 'Hidden', 'Last', 'Fading', 'Still', 'Deep', 'Shaded', 'Silent', 'Forgotten', 'Waiting', 'Cool'
  ],
  abstract: [
    'Silence', 'Heat', 'Thirst', 'Mirage', 'Horizon', 'Dust', 'Shade', 'Stillness', 'Drywind', 'Noon'
  ]
} as const

const desertWellPatterns = [
  '{heat} {relief}',
  '{heat} {structure}',
  '{adjective} {structure}',
  '{structure} of {abstract}',
  '{relief} of the {heat}'
] as const

function fillDesertWellPattern(pattern: string): string {
  return pattern
    .replace('{heat}', pick(desertWellWordPools.heat))
    .replace('{relief}', pick(desertWellWordPools.relief))
    .replace('{structure}', pick(desertWellWordPools.structures))
    .replace('{adjective}', pick(desertWellWordPools.adjectives))
    .replace('{abstract}', pick(desertWellWordPools.abstract))
}

export function generateDesertWellName(): string {
  return fillDesertWellPattern(pick(desertWellPatterns))
}

type PillagerOutpostPattern = (pools: PillagerOutpostPools) => string

interface PillagerOutpostPools {
  faction: string[]
  adjectives: string[]
  structures: string[]
  materials: string[]
  abstract: string[]
  curated: string[]
}

const pillagerOutpostPools: PillagerOutpostPools = {
  faction: ['Pillager', 'Raider', 'Marauder', 'Outlaw', 'Blackguard'],
  adjectives: ['Rough', 'Grim', 'Stark', 'Iron', 'Brutal', 'Cold', 'Bleak', 'Broken', 'Worn', 'Harsh'],
  structures: ['Outpost', 'Watchtower', 'Tower', 'Camp', 'Hold', 'Encampment', 'Post', 'Stockade', 'Fort'],
  materials: ['Iron', 'Timber', 'Spike', 'Bone', 'Ash', 'Blackwood'],
  abstract: ['Watch', 'Control', 'Dominion', 'Reach', 'Frontier', 'Guard', 'Territory', 'Line'],
  curated: ['Raider Outpost', 'Grim Watchtower', 'Iron Stockade', 'Marauder Camp', 'Blackguard Hold']
}

const pillagerOutpostPatterns: PillagerOutpostPattern[] = [
  (p) => `${pick(p.faction)} ${pick(p.structures)}`,
  (p) => `${pick(p.adjectives)} ${pick(p.structures)}`,
  (p) => `${pick(p.structures)} of ${pick(p.abstract)}`,
  (p) => `${pick(p.materials)} ${pick(p.structures)}`
]

export function generatePillagerOutpostName(): string {
  if (Math.random() < 0.15) {
    return pick(pillagerOutpostPools.curated)
  }
  const pattern = pick(pillagerOutpostPatterns)
  return pattern(pillagerOutpostPools)
}

export function generatePillagerOutpostNames(count: number): string[] {
  const results = new Set<string>()
  while (results.size < count) {
    results.add(generatePillagerOutpostName())
  }
  return Array.from(results)
}

const ancientCityPrefixes = ['Deep', 'Echo', 'Hollow', 'Sculk', 'Warden', 'Vault', 'Abandoned', 'Sunken', 'Silent', 'Forgotten']
const ancientCitySuffixes = ['City', 'Ruins', 'Halls', 'Sanctum', 'Nexus', 'Depths', 'Citadel', 'Remnant']

export function generateAncientCityName(): string {
  const prefix = ancientCityPrefixes[Math.floor(Math.random() * ancientCityPrefixes.length)]
  const suffix = ancientCitySuffixes[Math.floor(Math.random() * ancientCitySuffixes.length)]
  return `${prefix} ${suffix}`
}

const trailRuinsPrefixes = ['Old', 'Lost', 'Overgrown', 'Broken', 'Ancient', 'Mossy', 'Weathered', 'Hidden', 'Faded', 'Crumbling']
const trailRuinsSuffixes = ['Trail', 'Path', 'Site', 'Remnants', 'Dig', 'Ruin', 'Relic', 'Find']

export function generateTrailRuinsName(): string {
  const prefix = trailRuinsPrefixes[Math.floor(Math.random() * trailRuinsPrefixes.length)]
  const suffix = trailRuinsSuffixes[Math.floor(Math.random() * trailRuinsSuffixes.length)]
  return `${prefix} ${suffix}`
}

// --- Buried Treasure name generator (spec: tasks/buried_treasure_name_generator_spec.md) ---

const BURIED_TREASURE_OBJECTS = [
  'Cache', 'Hoard', 'Chest', 'Strongbox', 'Lockbox', 'Coffer', 'Stash', 'Vault', 'Booty', 'Bounty', 'Reliquary'
]

const BURIED_TREASURE_ADJECTIVES = [
  'Buried', 'Sunken', 'Forgotten', 'Salt-Stained', 'Ancient', 'Hidden', 'Lost', 'Weathered', 'Gilded', 'Rusted',
  'Blackened', 'Drifted', 'Dusty', 'Sealed', 'Forsaken', 'Drowned', 'Bleached', 'Stormworn'
]

const BURIED_TREASURE_OWNERS = [
  'Blacktide', 'Marrow Jack', 'Calder', 'Durnan', 'Virel', 'Red Kellan', 'Storm Garrick', 'Harrick', 'Old Fen',
  'Gravehook', 'Salt Mara', 'Thorne', 'Morrow Pike', 'Edda Vane', 'Cutter Voss'
]

const BURIED_TREASURE_PLACES = [
  'Reef', 'Cove', 'Mangrove', 'Dune', 'Shore', 'Tide', 'Lagoon', 'Shoal', 'Cliff', 'Hollow', 'Inlet', 'Coast', 'Bay', 'Sandbar', 'Marsh'
]

const BURIED_TREASURE_BANNED_WORDS = ['Treasure', 'Loot', 'Gold', 'Riches']

type BuriedTreasurePatternId = 'owner_object' | 'adj_object' | 'place_object' | 'adj_place_object' | 'owner_lost_object' | 'object_of_owner_or_place'

const BURIED_TREASURE_PATTERN_WEIGHTS: { id: BuriedTreasurePatternId; weight: number }[] = [
  { id: 'owner_object', weight: 30 },
  { id: 'adj_object', weight: 30 },
  { id: 'place_object', weight: 15 },
  { id: 'adj_place_object', weight: 15 },
  { id: 'owner_lost_object', weight: 7 },
  { id: 'object_of_owner_or_place', weight: 3 },
]

function pickWeightedBuriedTreasurePattern(): BuriedTreasurePatternId {
  const total = BURIED_TREASURE_PATTERN_WEIGHTS.reduce((s, p) => s + p.weight, 0)
  let r = Math.random() * total
  for (const { id, weight } of BURIED_TREASURE_PATTERN_WEIGHTS) {
    r -= weight
    if (r <= 0) return id
  }
  return BURIED_TREASURE_PATTERN_WEIGHTS[0].id
}

function buildBuriedTreasureCandidate(pattern: BuriedTreasurePatternId): string {
  const obj = () => BURIED_TREASURE_OBJECTS[Math.floor(Math.random() * BURIED_TREASURE_OBJECTS.length)]
  const adj = () => BURIED_TREASURE_ADJECTIVES[Math.floor(Math.random() * BURIED_TREASURE_ADJECTIVES.length)]
  const owner = () => BURIED_TREASURE_OWNERS[Math.floor(Math.random() * BURIED_TREASURE_OWNERS.length)]
  const place = () => BURIED_TREASURE_PLACES[Math.floor(Math.random() * BURIED_TREASURE_PLACES.length)]

  switch (pattern) {
    case 'owner_object':
      return `${owner()}'s ${obj()}`
    case 'adj_object':
      return `The ${adj()} ${obj()}`
    case 'place_object':
      return `The ${place()} ${obj()}`
    case 'adj_place_object':
      return `The ${adj()} ${place()} ${obj()}`
    case 'owner_lost_object':
      return `${owner()}'s Lost ${obj()}`
    case 'object_of_owner_or_place':
      const o = obj()
      return Math.random() < 0.6 ? `The ${o} of ${owner()}` : `The ${o} of the ${place()}`
    default:
      return `${owner()}'s ${obj()}`
  }
}

function passesBuriedTreasureValidation(name: string): boolean {
  const words = name.split(/\s+/)
  for (const banned of BURIED_TREASURE_BANNED_WORDS) {
    if (name.includes(banned)) return false
  }
  for (let i = 0; i < words.length - 1; i++) {
    if (words[i].toLowerCase() === words[i + 1].toLowerCase()) return false
  }
  if (words.length < 2 || words.length > 5) return false
  return true
}

export function generateBuriedTreasureName(): string {
  const maxAttempts = 50
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const pattern = pickWeightedBuriedTreasurePattern()
    const candidate = buildBuriedTreasureCandidate(pattern).replace(/\s+/g, ' ').trim()
    if (passesBuriedTreasureValidation(candidate)) return candidate
  }
  return `${BURIED_TREASURE_OWNERS[0]}'s ${BURIED_TREASURE_OBJECTS[0]}`
}