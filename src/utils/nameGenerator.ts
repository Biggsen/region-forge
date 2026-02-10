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
  // Otherworldly/eldritch suffixes
  'abyss', 'rift', 'void', 'scar', 'coil', 'expanse', 'sprawl', 'depths', 'mire', 'forge',
  'marrow', 'nexus', 'gate', 'portal', 'chasm', 'pit', 'core', 'heart', 'soul',
  // Dark medieval/cursed vibes
  'maw', 'dominion', 'crucible', 'descent', 'bastion', 'veins', 'reach', 'marches',
  'wasteland', 'barrens', 'waste', 'ruins', 'graveyard', 'cemetery', 'ossuary',
  'dungeon', 'prison', 'torture', 'suffering', 'torment', 'agony', 'despair',
  'plague', 'pestilence', 'blight', 'curse', 'bane', 'doom', 'ruin', 'destruction',
  // Traditional nether elements (no blocks)
  'realm', 'domain', 'land', 'world', 'dimension', 'plane',
  'fire', 'flame', 'ember', 'ash', 'cinder', 'smoke', 'fume', 'lava', 'magma',
  'fortress', 'ruin', 'desert', 'heights', 'peaks', 'valleys', 'caverns', 'tunnels', 'corridors',
  'halls', 'chambers', 'vaults', 'crypts', 'tombs', 'graves', 'mausoleums',
  'sanctuary', 'shrine', 'altar', 'temple', 'cathedral', 'monastery', 'abbey',
  'keep', 'tower', 'citadel', 'stronghold', 'battlements', 'ramparts', 'walls'
]

const netherThemes = [
  // Otherworldly/eldritch themes
  'Xyrrath', 'Chthonic', 'Mor\'gath', 'Nihil', 'Ebon', 'Umbral', 'Voidscar', 'Riftmarrow', 'Khorvus', 'Azrak',
  'The Chthonic', 'The Nihil', 'The Umbral', 'The Voidscar', 'The Riftmarrow', 'The Ebon', 'The Azrak',
  // Dark medieval/cursed vibes
  'The Bleak', 'The Ashen', 'The Black', 'The Infernal', 'The Scourged', 'The Bloodfire', 'The Hollow', 'The Oblivion', 'The Withered',
  'The Cursed', 'The Forsaken', 'The Damned', 'The Blighted', 'The Corrupted', 'The Tainted', 'The Defiled', 'The Desecrated',
  'The Ancient', 'The Forgotten', 'The Lost', 'The Abandoned', 'The Ruined', 'The Decayed', 'The Rotting', 'The Festering',
  'The Cruel', 'The Vile', 'The Wicked', 'The Malicious', 'The Sinister', 'The Malevolent', 'The Nefarious', 'The Diabolical',
  'Woe', 'Despair', 'Torment', 'Agony', 'Suffering', 'Plague', 'Pestilence', 'Blight', 'Curse', 'Bane',
  // Traditional nether themes (no blocks)
  'Infernal', 'Hellish', 'Fiery', 'Burning', 'Scorching', 'Blazing', 'Searing',
  'Molten', 'Lava', 'Magma', 'Ash', 'Ember', 'Cinder', 'Smoke', 'Fume',
  'Soul', 'Wither', 'Death', 'Doom', 'Chaos', 'Void', 'Abyss', 'Darkness',
  'Shadow', 'Grim', 'Desolate', 'Barren', 'Wasted', 'Ruined',
  'Crimson', 'Warped', 'Nether', 'Hell', 'Inferno', 'Purgatory', 'Limbo',
  'Fortress', 'Bastion', 'Ruin', 'Waste', 'Desert', 'Barrens', 'Depths'
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

// Main functions that choose between overworld and nether based on dimension
export function generateRegionName(dimension: 'overworld' | 'nether' | 'end'): string {
  // Filter 'end' to 'overworld' for now (end names not implemented)
  const effectiveDimension = dimension === 'end' ? 'overworld' : dimension
  return effectiveDimension === 'nether' ? generateNetherName() : generateMedievalName()
}

export function generateVillageNameByWorldType(dimension: 'overworld' | 'nether' | 'end'): string {
  // Villages don't exist in the nether or end, so always use overworld village names
  return generateVillageName()
}