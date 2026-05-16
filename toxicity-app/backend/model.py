import asyncio
import re

class XLMRoBERTModel:
    def __init__(self):
        self.labels = ["Threat", "Hate Speech", "Insult", "Obscenity", "Sarcasm"]

        # Comprehensive toxic keyword dictionary
        self.toxic_keywords = {
            # Threats
            "kill":        {"Threat": 0.95, "Hate Speech": 0.3},
            "murder":      {"Threat": 0.95, "Hate Speech": 0.4},
            "die":         {"Threat": 0.80, "Hate Speech": 0.3},
            "hurt":        {"Threat": 0.75},
            "destroy":     {"Threat": 0.80},
            "attack":      {"Threat": 0.78},
            "shoot":       {"Threat": 0.90, "Hate Speech": 0.4},
            "bomb":        {"Threat": 0.92, "Hate Speech": 0.3},
            "stab":        {"Threat": 0.93},
            "fight":       {"Threat": 0.65},
            "threaten":    {"Threat": 0.85},
            "eliminate":   {"Threat": 0.80},
            "beat":        {"Threat": 0.70},
            "smash":       {"Threat": 0.65},
            "punish":      {"Threat": 0.68},
            "ruin":        {"Threat": 0.65},
            "assault":     {"Threat": 0.90, "Hate Speech": 0.3},
            "slaughter":   {"Threat": 0.95, "Hate Speech": 0.4},
            "massacre":    {"Threat": 0.97, "Hate Speech": 0.5},
            "strangle":    {"Threat": 0.93},
            "choke":       {"Threat": 0.85},
            "slash":       {"Threat": 0.88},
            "execute":     {"Threat": 0.90, "Hate Speech": 0.3},
            "exterminate": {"Threat": 0.95, "Hate Speech": 0.6},
            "annihilate":  {"Threat": 0.92, "Hate Speech": 0.4},
            "slap":        {"Threat": 0.70},
            "bash":        {"Threat": 0.72},
            "batter":      {"Threat": 0.82},
            "crucify":     {"Threat": 0.80, "Hate Speech": 0.3},
            "hang":        {"Threat": 0.85, "Hate Speech": 0.4},
            "torture":     {"Threat": 0.93, "Hate Speech": 0.4},
            "kidnap":      {"Threat": 0.92},
            "rape":        {"Threat": 0.99, "Obscenity": 0.95, "Hate Speech": 0.8},
            "violate":     {"Threat": 0.85, "Obscenity": 0.6},
            "harm":        {"Threat": 0.78},
            "maim":        {"Threat": 0.90},
            "cripple":     {"Threat": 0.80, "Insult": 0.5},
            "butcher":     {"Threat": 0.92, "Hate Speech": 0.3},
            "lynch":       {"Threat": 0.96, "Hate Speech": 0.9},
            "drown":       {"Threat": 0.88},
            "poison":      {"Threat": 0.88},
            "terrorize":   {"Threat": 0.90, "Hate Speech": 0.5},
            "intimidate":  {"Threat": 0.80},
            "stalk":       {"Threat": 0.80},
            "harass":      {"Threat": 0.78, "Insult": 0.5},
            "blackmail":   {"Threat": 0.85},
            "doxx":        {"Threat": 0.88},
            "doxing":      {"Threat": 0.88},

            # Hate Speech
            "hate":        {"Hate Speech": 0.85, "Insult": 0.4},
            "racist":      {"Hate Speech": 0.92},
            "racism":      {"Hate Speech": 0.92},
            "sexist":      {"Hate Speech": 0.90},
            "sexism":      {"Hate Speech": 0.90},
            "bigot":       {"Hate Speech": 0.88},
            "bigotry":     {"Hate Speech": 0.88},
            "nazi":        {"Hate Speech": 0.96, "Threat": 0.3},
            "fascist":     {"Hate Speech": 0.90, "Threat": 0.3},
            "terrorist":   {"Hate Speech": 0.88, "Threat": 0.6},
            "inferior":    {"Hate Speech": 0.78, "Insult": 0.5},
            "subhuman":    {"Hate Speech": 0.97, "Insult": 0.6},
            "filth":       {"Hate Speech": 0.80, "Obscenity": 0.7},
            "vermin":      {"Hate Speech": 0.85},
            "parasite":    {"Hate Speech": 0.82, "Insult": 0.5},
            "scum":        {"Hate Speech": 0.80, "Insult": 0.75},
            "homophobe":   {"Hate Speech": 0.90},
            "homophobic":  {"Hate Speech": 0.90},
            "transphobe":  {"Hate Speech": 0.90},
            "transphobic": {"Hate Speech": 0.90},
            "xenophobe":   {"Hate Speech": 0.88},
            "xenophobic":  {"Hate Speech": 0.88},
            "antisemitic": {"Hate Speech": 0.95},
            "islamophobe": {"Hate Speech": 0.92},
            "misogynist":  {"Hate Speech": 0.92, "Insult": 0.5},
            "misogyny":    {"Hate Speech": 0.92},
            "supremacist": {"Hate Speech": 0.95, "Threat": 0.4},
            "extremist":   {"Hate Speech": 0.88, "Threat": 0.5},
            "radicalize":  {"Hate Speech": 0.85, "Threat": 0.4},
            "oppressor":   {"Hate Speech": 0.80},
            "colonizer":   {"Hate Speech": 0.78},
            "discriminate":{"Hate Speech": 0.82},
            "prejudice":   {"Hate Speech": 0.78},
            "stereotype":  {"Hate Speech": 0.70},
            "slur":        {"Hate Speech": 0.85},
            "savage":      {"Hate Speech": 0.80, "Insult": 0.5},
            "barbarian":   {"Hate Speech": 0.78, "Insult": 0.5},
            "uncivilized": {"Hate Speech": 0.80, "Insult": 0.5},
            "mongrel":     {"Hate Speech": 0.85, "Insult": 0.6},
            "mutt":        {"Hate Speech": 0.80, "Insult": 0.5},
            "invasion":    {"Hate Speech": 0.72},
            "replacement": {"Hate Speech": 0.70},

            # Insults – general
            "idiot":       {"Insult": 0.90, "Obscenity": 0.2},
            "stupid":      {"Insult": 0.80},
            "dumb":        {"Insult": 0.78},
            "dumbass":     {"Insult": 0.88, "Obscenity": 0.5},
            "moron":       {"Insult": 0.88},
            "imbecile":    {"Insult": 0.88},
            "fool":        {"Insult": 0.75},
            "loser":       {"Insult": 0.82},
            "useless":     {"Insult": 0.85},
            "worthless":   {"Insult": 0.87},
            "pathetic":    {"Insult": 0.85},
            "trash":       {"Insult": 0.83, "Hate Speech": 0.3},
            "garbage":     {"Insult": 0.80},
            "disgusting":  {"Insult": 0.78, "Hate Speech": 0.3},
            "horrible":    {"Insult": 0.72},
            "terrible":    {"Insult": 0.68},
            "awful":       {"Insult": 0.68},
            "worst":       {"Insult": 0.75},
            "ugly":        {"Insult": 0.80},
            "freak":       {"Insult": 0.82},
            "creep":       {"Insult": 0.78},
            "weirdo":      {"Insult": 0.76},
            "coward":      {"Insult": 0.77},
            "liar":        {"Insult": 0.75},
            "failure":     {"Insult": 0.80},
            "incompetent": {"Insult": 0.82},
            "brainless":   {"Insult": 0.84},
            "ignorant":    {"Insult": 0.76},
            "clown":       {"Insult": 0.74},
            "joke":        {"Insult": 0.65},
            "disappointment":{"Insult": 0.78},
            "fat":         {"Insult": 0.75},
            "obese":       {"Insult": 0.78},
            "overweight":  {"Insult": 0.68},
            "skinny":      {"Insult": 0.60},
            "lazy":        {"Insult": 0.70},
            "slacker":     {"Insult": 0.72},
            "selfish":     {"Insult": 0.70},
            "arrogant":    {"Insult": 0.72},
            "narcissist":  {"Insult": 0.78},
            "jerk":        {"Insult": 0.80},
            "scumbag":     {"Insult": 0.88, "Obscenity": 0.5},
            "lowlife":     {"Insult": 0.84},
            "nobody":      {"Insult": 0.68},
            "good-for-nothing": {"Insult": 0.87},
            "dimwit":      {"Insult": 0.82},
            "nitwit":      {"Insult": 0.80},
            "halfwit":     {"Insult": 0.82},
            "dunce":       {"Insult": 0.80},
            "dullard":     {"Insult": 0.78},
            "dolt":        {"Insult": 0.80},
            "blockhead":   {"Insult": 0.78},
            "bonehead":    {"Insult": 0.78},
            "knucklehead": {"Insult": 0.76},
            "silly":       {"Insult": 0.55},
            "annoying":    {"Insult": 0.68},
            "insufferable":{"Insult": 0.80},
            "obnoxious":   {"Insult": 0.78},
            "vile":        {"Insult": 0.82, "Hate Speech": 0.4},
            "repulsive":   {"Insult": 0.80},
            "nasty":       {"Insult": 0.76, "Obscenity": 0.3},
            "evil":        {"Insult": 0.72, "Hate Speech": 0.3},
            "corrupt":     {"Insult": 0.72},
            "dishonest":   {"Insult": 0.70},
            "deceitful":   {"Insult": 0.72},
            "manipulative":{"Insult": 0.75},
            "hypocrite":   {"Insult": 0.75},
            "lunatic":     {"Insult": 0.80},
            "psycho":      {"Insult": 0.82},
            "maniac":      {"Insult": 0.80},
            "nutcase":     {"Insult": 0.80},
            "nutjob":      {"Insult": 0.82},
            "crazy":       {"Insult": 0.72},
            "insane":      {"Insult": 0.70},
            "mad":         {"Insult": 0.62},
            "unstable":    {"Insult": 0.72},
            "deranged":    {"Insult": 0.82},
            "unhinged":    {"Insult": 0.80},
            "retard":      {"Insult": 0.93, "Hate Speech": 0.5},
            "retarded":    {"Insult": 0.93, "Hate Speech": 0.5},
            "mental":      {"Insult": 0.68},
            "sociopath":   {"Insult": 0.80},
            "narcissistic":{"Insult": 0.75},
            "spineless":   {"Insult": 0.80},
            "gutless":     {"Insult": 0.80},
            "brainwashed": {"Insult": 0.78},
            "clueless":    {"Insult": 0.72},
            "hopeless":    {"Insult": 0.72},
            "helpless":    {"Insult": 0.65},
            "pointless":   {"Insult": 0.70},
            "insignificant":{"Insult": 0.75},
            "irrelevant":  {"Insult": 0.75},
            "unimportant": {"Insult": 0.70},
            "invisible":   {"Insult": 0.65},
            "forgettable": {"Insult": 0.70},
            "mediocre":    {"Insult": 0.65},
            "inferior":    {"Insult": 0.75, "Hate Speech": 0.4},
            "subpar":      {"Insult": 0.68},
            "disappointing":{"Insult": 0.72},
            "embarrassing":{"Insult": 0.75},
            "shameful":    {"Insult": 0.75},
            "mockery":     {"Insult": 0.72},
            "ridiculous":  {"Insult": 0.68},
            "absurd":      {"Insult": 0.65},
            "pitiful":     {"Insult": 0.78},
            "pathological":{"Insult": 0.72},
            "toxic":       {"Insult": 0.70},

            # Common everyday insults / abusive words
            "rascal":      {"Insult": 0.78},
            "scoundrel":   {"Insult": 0.82},
            "villain":     {"Insult": 0.78, "Threat": 0.3},
            "brute":       {"Insult": 0.80, "Threat": 0.4},
            "beast":       {"Insult": 0.72},
            "monster":     {"Insult": 0.80, "Hate Speech": 0.3},
            "cretin":      {"Insult": 0.85},
            "buffoon":     {"Insult": 0.80},
            "lout":        {"Insult": 0.78},
            "oaf":         {"Insult": 0.75},
            "boor":        {"Insult": 0.72},
            "pig":         {"Insult": 0.80, "Obscenity": 0.3},
            "swine":       {"Insult": 0.82, "Obscenity": 0.3},
            "rat":         {"Insult": 0.75},
            "snake":       {"Insult": 0.75},
            "worm":        {"Insult": 0.72},
            "maggot":      {"Insult": 0.85, "Obscenity": 0.4},
            "leech":       {"Insult": 0.75},
            "roach":       {"Insult": 0.80, "Hate Speech": 0.3},
            "cockroach":   {"Insult": 0.82, "Hate Speech": 0.4},
            "dog":         {"Insult": 0.65},
            "mongrel":     {"Insult": 0.80, "Hate Speech": 0.5},
            "hound":       {"Insult": 0.65},
            "mutt":        {"Insult": 0.72},
            "filthy":      {"Insult": 0.78, "Obscenity": 0.5},
            "slimy":       {"Insult": 0.75},
            "gross":       {"Insult": 0.68},
            "sleazebag":   {"Insult": 0.85, "Obscenity": 0.5},
            "sleaze":      {"Insult": 0.80},
            "pervert":     {"Insult": 0.88, "Obscenity": 0.6},
            "sicko":       {"Insult": 0.85},
            "fruitcake":   {"Insult": 0.72},
            "wacko":       {"Insult": 0.74},
            "halfwit":     {"Insult": 0.82},
            "lamebrain":   {"Insult": 0.80},
            "dingbat":     {"Insult": 0.75},
            "airhead":     {"Insult": 0.75},
            "birdbrain":   {"Insult": 0.78},
            "pinhead":     {"Insult": 0.78},
            "fathead":     {"Insult": 0.78},
            "deadbeat":    {"Insult": 0.80},
            "delinquent":  {"Insult": 0.72},
            "thug":        {"Insult": 0.78, "Threat": 0.4, "Hate Speech": 0.3},
            "punk":        {"Insult": 0.72},
            "brat":        {"Insult": 0.68},
            "pest":        {"Insult": 0.65},
            "nuisance":    {"Insult": 0.65},
            "menace":      {"Insult": 0.72, "Threat": 0.4},
            "scumbag":     {"Insult": 0.88, "Obscenity": 0.5},
            "dirtbag":     {"Insult": 0.85, "Obscenity": 0.4},
            "scuzzball":   {"Insult": 0.82, "Obscenity": 0.4},
            "screw":       {"Insult": 0.65},
            "trash":       {"Insult": 0.83, "Hate Speech": 0.3},
            "riffraff":    {"Insult": 0.78, "Hate Speech": 0.3},
            "lowlife":     {"Insult": 0.84},
            "dropout":     {"Insult": 0.68},
            "hooligan":    {"Insult": 0.78, "Threat": 0.3},
            "liar":        {"Insult": 0.75},
            "cheat":       {"Insult": 0.72},
            "fraud":       {"Insult": 0.78},
            "crook":       {"Insult": 0.78},
            "criminal":    {"Insult": 0.70},
            "thief":       {"Insult": 0.72},
            # Online abuse / internet slang
            "troll":       {"Insult": 0.72},
            "spammer":     {"Insult": 0.65},
            "bot":         {"Insult": 0.58},
            "shill":       {"Insult": 0.68},
            "simp":        {"Insult": 0.72},
            "incel":       {"Insult": 0.80, "Hate Speech": 0.4},
            "virgin":      {"Insult": 0.65},
            "basement":    {"Insult": 0.60},
            "neckbeard":   {"Insult": 0.75},
            "keyboard":    {"Insult": 0.55},
            "triggered":   {"Insult": 0.62},
            "snowflake":   {"Insult": 0.68},
            "crybaby":     {"Insult": 0.72},
            "bootlicker":  {"Insult": 0.75},
            "sellout":     {"Insult": 0.68},
            "attention-seeker": {"Insult": 0.72},
            "entitled":    {"Insult": 0.68},
            "karen":       {"Insult": 0.75},
            "manchild":    {"Insult": 0.78},
            "pathological":{"Insult": 0.72},
            # Body shaming
            "grotesque":   {"Insult": 0.82},
            "hideous":     {"Insult": 0.82},
            "repugnant":   {"Insult": 0.80},
            "deformed":    {"Insult": 0.78, "Hate Speech": 0.3},
            "misshapen":   {"Insult": 0.72},
            "foul":        {"Insult": 0.72, "Obscenity": 0.4},
            "stench":      {"Insult": 0.68},
            "disgusted":   {"Insult": 0.65},

            # Obscenity
            "fuck":        {"Obscenity": 0.99, "Insult": 0.7},
            "shit":        {"Obscenity": 0.95},
            "bitch":       {"Obscenity": 0.90, "Insult": 0.75},
            "damn":        {"Obscenity": 0.60},
            "ass":         {"Obscenity": 0.75},
            "asshole":     {"Obscenity": 0.95, "Insult": 0.85},
            "bastard":     {"Obscenity": 0.88, "Insult": 0.75},
            "crap":        {"Obscenity": 0.70},
            "piss":        {"Obscenity": 0.75},
            "whore":       {"Obscenity": 0.93, "Insult": 0.80},
            "slut":        {"Obscenity": 0.93, "Insult": 0.80},
            "dick":        {"Obscenity": 0.85, "Insult": 0.60},
            "cunt":        {"Obscenity": 0.98, "Insult": 0.85},
            "cock":        {"Obscenity": 0.82},
            "douchebag":   {"Obscenity": 0.85, "Insult": 0.80},
            "prick":       {"Obscenity": 0.85, "Insult": 0.75},
            "wanker":      {"Obscenity": 0.85, "Insult": 0.75},
            "twat":        {"Obscenity": 0.90, "Insult": 0.78},
            "bollocks":    {"Obscenity": 0.78},
            "jackass":     {"Obscenity": 0.80, "Insult": 0.78},
            "dipshit":     {"Obscenity": 0.88, "Insult": 0.80},
            "shithead":    {"Obscenity": 0.95, "Insult": 0.85},
            "hellhole":    {"Obscenity": 0.70},

            # Derogatory descriptors (often paired with person/human nouns)
            "waste":        {"Insult": 0.80},
            "burden":       {"Insult": 0.75},
            "disgrace":     {"Insult": 0.82},
            "embarrassment":{"Insult": 0.78},
            "plague":       {"Insult": 0.75, "Hate Speech": 0.3},
            "disease":      {"Insult": 0.72, "Hate Speech": 0.3},
            "cancer":       {"Insult": 0.78, "Hate Speech": 0.4},
            "primitive":    {"Insult": 0.72, "Hate Speech": 0.4},
            "degenerate":   {"Insult": 0.85, "Hate Speech": 0.5},
            "delusional":   {"Insult": 0.72},
            "miserable":    {"Insult": 0.72},
            "pitiful":      {"Insult": 0.78},
            "despicable":   {"Insult": 0.82},
            "contemptible": {"Insult": 0.82},
            "detestable":   {"Insult": 0.80},
            "abhorrent":    {"Insult": 0.82, "Hate Speech": 0.3},
            "abysmal":      {"Insult": 0.74},
            "abomination":  {"Insult": 0.85, "Hate Speech": 0.4},
            "atrocious":    {"Insult": 0.78},
            "deplorable":   {"Insult": 0.80},
            "wretched":     {"Insult": 0.78},
            "revolting":    {"Insult": 0.80},
            "nauseating":   {"Insult": 0.78},
            "sickening":    {"Insult": 0.78},
            "loathsome":    {"Insult": 0.82},
            "odious":       {"Insult": 0.80},
            "unworthy":     {"Insult": 0.77},
            "beneath":      {"Insult": 0.65},
            "substandard":  {"Insult": 0.68},
            "defective":    {"Insult": 0.72},
            "deficient":    {"Insult": 0.68},
            "broken":       {"Insult": 0.65},
        }

        # Multi-word toxic phrases (exact substring matches)
        self.toxic_phrases = [
            # Threats
            ("go to hell",              {"Insult": 0.85, "Threat": 0.4}),
            ("drop dead",               {"Threat": 0.88, "Insult": 0.70}),
            ("go die",                  {"Threat": 0.90, "Insult": 0.75}),
            ("i will hurt you",         {"Threat": 0.92}),
            ("i will kill you",         {"Threat": 0.97}),
            ("i will destroy you",      {"Threat": 0.90}),
            ("you will pay",            {"Threat": 0.80}),
            ("watch your back",         {"Threat": 0.78}),
            # Insults
            ("shut up",                 {"Insult": 0.72}),
            ("you suck",                {"Insult": 0.82}),
            ("get lost",                {"Insult": 0.68}),
            ("i hate you",              {"Hate Speech": 0.80, "Insult": 0.75}),
            ("you are nothing",         {"Insult": 0.85}),
            ("you are worthless",       {"Insult": 0.90}),
            ("you are useless",         {"Insult": 0.90}),
            ("you are pathetic",        {"Insult": 0.88}),
            ("you are trash",           {"Insult": 0.88}),
            ("you are garbage",         {"Insult": 0.88}),
            ("you are a waste",         {"Insult": 0.88}),
            ("you are disgusting",      {"Insult": 0.85}),
            ("you are stupid",          {"Insult": 0.82}),
            ("you are an idiot",        {"Insult": 0.88}),
            ("you are a loser",         {"Insult": 0.85}),
            ("you are a failure",       {"Insult": 0.85}),
            ("you are a burden",        {"Insult": 0.87}),
            ("you are a disgrace",      {"Insult": 0.87}),
            ("you are a joke",          {"Insult": 0.80}),
            ("you are irrelevant",      {"Insult": 0.80}),
            ("good for nothing",        {"Insult": 0.87}),
            ("no one likes you",        {"Insult": 0.83}),
            ("no one cares about you",  {"Insult": 0.85}),
            ("nobody likes you",        {"Insult": 0.83}),
            ("nobody wants you",        {"Insult": 0.85}),
            ("nobody cares",            {"Insult": 0.75}),
            # waste + person/human/being combos
            ("waste of space",          {"Insult": 0.88}),
            ("waste of time",           {"Insult": 0.72}),
            ("waste of life",           {"Insult": 0.92}),
            ("waste of oxygen",         {"Insult": 0.93}),
            ("waste of skin",           {"Insult": 0.92}),
            ("waste of a person",       {"Insult": 0.90}),
            ("waste of a human",        {"Insult": 0.92}),
            ("waste of a human being",  {"Insult": 0.93}),
            ("waste of resources",      {"Insult": 0.82}),
            ("waste person",            {"Insult": 0.87}),
            ("waste human",             {"Insult": 0.88}),
            ("such a waste",            {"Insult": 0.80}),
            ("complete waste",          {"Insult": 0.85}),
            ("total waste",             {"Insult": 0.83}),
            ("utter waste",             {"Insult": 0.85}),
            # Dismissiveness
            ("get out of here",         {"Insult": 0.68}),
            ("who asked you",           {"Insult": 0.70}),
            ("no one asked",            {"Insult": 0.68}),
            ("you don't matter",        {"Insult": 0.83}),
            ("you never mattered",      {"Insult": 0.85}),
            ("you are irrelevant",      {"Insult": 0.80}),
            ("your life is pointless",  {"Insult": 0.90}),
            ("you should be ashamed",   {"Insult": 0.80}),
            # Abbreviated / internet-speak threat variants
            ("i will kill u",           {"Threat": 0.97}),
            ("ima kill u",              {"Threat": 0.97}),
            ("gonna kill u",            {"Threat": 0.95}),
            ("i will hurt u",           {"Threat": 0.92}),
            ("i will destroy u",        {"Threat": 0.90}),
            ("ima hurt u",              {"Threat": 0.90}),
            ("gonna hurt u",            {"Threat": 0.90}),
            ("u will pay",              {"Threat": 0.80}),
            ("ur dead",                 {"Threat": 0.92}),
            ("ur gonna die",            {"Threat": 0.93}),
            ("go die",                  {"Threat": 0.90, "Insult": 0.75}),
            ("kys",                     {"Threat": 0.99, "Insult": 0.90}),
            ("kill urself",             {"Threat": 0.99, "Insult": 0.90}),
            ("kill yourself",           {"Threat": 0.99, "Insult": 0.90}),
            ("end urself",              {"Threat": 0.95}),
            ("end yourself",            {"Threat": 0.95}),
            ("u r dead",                {"Threat": 0.92}),
            ("u r nothing",             {"Insult": 0.85}),
            ("u r worthless",           {"Insult": 0.90}),
            ("u r useless",             {"Insult": 0.90}),
            ("no one likes u",          {"Insult": 0.83}),
            ("nobody likes u",          {"Insult": 0.83}),
            ("nobody wants u",          {"Insult": 0.85}),
            ("i hate u",                {"Hate Speech": 0.80, "Insult": 0.75}),
            ("shut up",                 {"Insult": 0.72}),
            ("stfu",                    {"Insult": 0.82, "Obscenity": 0.60}),
            ("gtfo",                    {"Insult": 0.80}),
            ("f u",                     {"Obscenity": 0.90, "Insult": 0.75}),
            ("fk u",                    {"Obscenity": 0.90, "Insult": 0.75}),
        ]

        self.sarcasm_keywords = [
            "yeah right", "sure", "whatever", "great job",
            "oh wow", "how original", "genius", "brilliant idea",
            "very helpful", "oh really", "as if", "like that matters",
        ]

        # ── Safe Words ──────────────────────────────────────────────────────
        # Words that are NEVER toxic on their own (complete false-positive guard)
        self.absolute_safe_words = {
            # Everyday positive/neutral words
            "hello", "hi", "hey", "greetings", "welcome", "goodbye", "bye",
            "please", "thank", "thanks", "sorry", "appreciate", "grateful",
            "love", "like", "enjoy", "happy", "glad", "joy", "excited",
            "great", "good", "nice", "excellent", "wonderful", "amazing",
            "fantastic", "awesome", "brilliant", "superb", "perfect",
            "beautiful", "gorgeous", "cute", "pretty", "handsome", "lovely",
            "kind", "sweet", "gentle", "caring", "helpful", "generous",
            "friendly", "warm", "cheerful", "polite", "respectful",
            "smart", "clever", "intelligent", "talented", "skilled",
            "brave", "strong", "confident", "calm", "peaceful", "safe",
            "yes", "no", "okay", "ok", "sure", "right", "correct",
            "true", "fair", "honest", "real", "genuine", "sincere",
            "agree", "support", "help", "care", "respect", "trust",
            "friend", "family", "team", "community", "together", "unity",
            "learn", "teach", "share", "grow", "improve", "achieve",
            "work", "study", "practice", "create", "build", "develop",
            "food", "water", "home", "school", "work", "health",
            "morning", "afternoon", "evening", "night", "today", "tomorrow",
            "sun", "moon", "star", "sky", "nature", "animal", "flower",
            "music", "art", "dance", "song", "movie", "book", "story",
            "sport", "game", "play", "fun", "laugh", "smile", "hope",
            "dream", "wish", "believe", "inspire", "motivate", "encourage",
        }

        # Context-modifying words: their presence near a toxic word reduces the score
        # (e.g. "kill" in a gaming context is likely not a real threat)
        self.context_reducers = {
            # Gaming context
            "game", "games", "gaming", "player", "players", "match", "round",
            "level", "boss", "enemy", "enemies", "npc", "character", "spawn",
            "respawn", "server", "clan", "guild", "raid", "quest", "mod",
            "minecraft", "fortnite", "roblox", "valorant", "pubg", "cod",
            "fps", "rpg", "mmo", "moba", "pvp", "pve", "gg", "lol", "oof",
            # Medical/scientific context
            "cancer", "disease", "diagnosis", "treatment", "patient", "hospital",
            "doctor", "medicine", "therapy", "research", "study", "clinical",
            "symptom", "drug", "vaccine", "surgery", "medical", "health",
            "biology", "chemistry", "science", "experiment", "lab", "test",
            # News / journalism context
            "news", "report", "article", "headline", "journalist", "media",
            "said", "according", "alleged", "suspect", "arrested", "charged",
            "politician", "government", "policy", "election", "court", "trial",
            "statement", "interview", "announced", "confirmed", "denied",
            # Fiction / creative writing context
            "novel", "story", "fiction", "character", "villain", "hero", "plot",
            "scene", "chapter", "book", "screenplay", "script", "film", "movie",
            "tv", "show", "series", "anime", "manga", "comic", "wrote", "write",
            # Software / tech context
            "bug", "code", "program", "function", "error", "crash", "debug",
            "process", "thread", "server", "database", "script",
            "terminal", "command", "deploy", "build", "test", "compile",
            # History / education context
            "history", "historical", "war", "battle", "ancient", "century",
            "empire", "revolution", "document", "educate", "lesson", "class",
            "professor", "teacher", "student", "textbook", "lecture", "exam",
        }

        # Negation words: if they precede a toxic word, dampen the score
        self.negation_words = {
            "not", "never", "no", "don't", "doesn't", "didn't", "won't",
            "wouldn't", "shouldn't", "couldn't", "cannot", "can't",
            "barely", "hardly", "scarcely", "stop", "avoid", "prevent",
            "against", "without", "instead", "refuse", "deny",
        }

    # Person-referencing nouns/pronouns — when near a derogatory word, amplify score
    PERSON_NOUNS = {
        "you", "your", "he", "she", "they", "him", "her", "them",
        "person", "human", "being", "people", "guy", "girl", "man",
        "woman", "kid", "child", "everyone", "somebody", "someone",
        "anyone", "nobody", "no one", "this person", "that person",
    }

    # Derogatory adjectives/nouns that become highly toxic when aimed at a person
    DEROGATORY_WORDS = {
        # Core insults
        "waste", "worthless", "useless", "pathetic", "garbage", "trash",
        "disgusting", "stupid", "dumb", "idiot", "moron", "loser",
        "failure", "fool", "scum", "burden", "disgrace", "embarrassment",
        "irrelevant", "nothing", "nobody", "degenerate", "miserable",
        "pitiful", "despicable", "vile", "repulsive", "evil",
        "horrible", "terrible", "awful", "nasty", "ugly",
        # Expanded
        "hideous", "grotesque", "repugnant", "revolting", "nauseating",
        "sickening", "loathsome", "odious", "abhorrent", "abomination",
        "wretched", "deplorable", "atrocious", "contemptible", "detestable",
        "hopeless", "pointless", "insignificant", "unimportant", "forgettable",
        "mediocre", "inferior", "subpar", "unworthy", "defective", "broken",
        "spineless", "gutless", "coward", "brainless", "clueless",
        "incompetent", "ignorant", "delusional", "unstable", "deranged",
        "unhinged", "psycho", "lunatic", "maniac", "nutcase", "crazy",
        "manipulative", "deceitful", "dishonest", "corrupt", "hypocrite",
        "narcissist", "toxic", "primitive", "savage", "uncivilized",
        "parasite", "plague", "disease", "cancer", "vermin", "filth",
        "freak", "creep", "weirdo", "jerk", "scumbag", "lowlife",
        "embarrassing", "shameful", "ridiculous", "absurd", "mockery",
        # Added common everyday insults
        "rascal", "scoundrel", "villain", "brute", "beast", "monster",
        "cretin", "buffoon", "lout", "oaf", "boor", "pig", "swine",
        "rat", "snake", "worm", "maggot", "leech", "roach", "cockroach",
        "filthy", "slimy", "gross", "sleazebag", "sleaze", "pervert",
        "sicko", "halfwit", "lamebrain", "dingbat", "airhead", "birdbrain",
        "pinhead", "fathead", "deadbeat", "delinquent", "thug", "punk",
        "brat", "pest", "nuisance", "menace", "dirtbag", "scuzzball",
        "riffraff", "hooligan", "fraud", "crook", "thief",
    }

    # ── Common internet abbreviation expansions ──────────────────────────
    ABBREV_MAP = [
        # Must be ordered longest-first to avoid partial replacements
        (r'\bkill urself\b',      'kill yourself'),
        (r'\bkill ur self\b',     'kill yourself'),
        (r'\bend urself\b',       'end yourself'),
        (r'\bgonna\b',            'going to'),
        (r'\bwanna\b',            'want to'),
        (r'\bgotta\b',            'got to'),
        (r'\bima\b',              'i am going to'),
        (r'\bimma\b',             'i am going to'),
        (r'\bur\b',               'your'),
        (r'\bu r\b',              'you are'),
        (r'\b4 u\b',              'for you'),
        (r'\bu\b',                'you'),
        (r'\br\b',                'are'),
        (r'\bkys\b',              'kys'),    # kept as-is (already in phrases)
        (r'\bstfu\b',             'stfu'),   # kept as-is
        (r'\bgtfo\b',             'gtfo'),   # kept as-is
        (r'\bfk\b',               'fuck'),
        (r'\bfck\b',              'fuck'),
        (r'\bsh1t\b',             'shit'),
        (r'\b[s$][h]?[1i][t7]\b','shit'),
        (r'\bf[u*][c][k*]\b',    'fuck'),
    ]

    async def predict(self, text: str):
        # Simulate network/compute delay (~50ms)
        await asyncio.sleep(0.05)

        lower_text = text.lower()

        # ── Expand abbreviations / leetspeak before analysis ──────────────
        normalized_text = lower_text
        for pattern, replacement in self.ABBREV_MAP:
            normalized_text = re.sub(pattern, replacement, normalized_text)

        # Use normalized text for word-level matching so abbreviations are expanded
        words = re.findall(r'\b\w+\b', normalized_text)
        word_set = set(words)

        # Base probabilities — very low baseline
        probs = {label: 0.03 for label in self.labels}
        highlights = []
        all_scores = []

        # ── Safety pre-check: is text entirely safe? ───────────────────────
        # Check if context reducers are present (gaming, news, medical, fiction)
        context_words_present = word_set & self.context_reducers
        context_multiplier = 0.45 if context_words_present else 1.0

        # ── 1. Single-word keyword matching ────────────────────────────────
        NEG_WINDOW = 3  # words before a toxic word to check for negation
        for i, word in enumerate(words):
            # Skip words that are in the absolute safe list
            if word in self.absolute_safe_words:
                continue

            if word in self.toxic_keywords:
                # Check for negation in the preceding window
                pre_window = set(words[max(0, i - NEG_WINDOW):i])
                is_negated = bool(pre_window & self.negation_words)
                negation_factor = 0.25 if is_negated else 1.0  # 75% dampening if negated

                # Check if this specific toxic word has a safe context nearby
                local_window = set(words[max(0, i - 4):min(len(words), i + 5)])
                local_context = local_window & self.context_reducers
                local_multiplier = 0.30 if local_context else context_multiplier

                highlights.append(word)
                for label, score in self.toxic_keywords[word].items():
                    adjusted = score * negation_factor * local_multiplier
                    # Only flag if adjusted score is meaningful (> 10%)
                    if adjusted > 0.10:
                        probs[label] = max(probs[label], adjusted)
                        all_scores.append(adjusted)
                    else:
                        # Remove from highlights if score is too low
                        if word in highlights:
                            highlights.remove(word)

        # ── 1b. Proximity combo detection ──────────────────────────────────
        WINDOW = 4
        for i, word in enumerate(words):
            if word in self.absolute_safe_words:
                continue
            if word in self.DEROGATORY_WORDS:
                window_start = max(0, i - WINDOW)
                window_end = min(len(words), i + WINDOW + 1)
                nearby = set(words[window_start:window_end])

                # Skip if strong context reducer is nearby
                if nearby & self.context_reducers:
                    continue

                # Check negation
                pre_window = set(words[max(0, i - 3):i])
                is_negated = bool(pre_window & self.negation_words)

                if nearby & self.PERSON_NOUNS and not is_negated:
                    combo_score = self.toxic_keywords.get(word, {}).get("Insult", 0.75)
                    combo_score = max(combo_score, 0.75)
                    probs["Insult"] = max(probs["Insult"], combo_score)
                    all_scores.append(combo_score)
                    if word not in highlights:
                        highlights.append(word)

        # ── 2. Multi-word phrase matching ───────────────────────────────────
        for phrase, label_scores in self.toxic_phrases:
            if phrase in lower_text or phrase in normalized_text:
                # Check negation at phrase start (search both texts)
                phrase_start_idx = lower_text.find(phrase)
                if phrase_start_idx == -1:
                    phrase_start_idx = normalized_text.find(phrase)
                    search_text = normalized_text
                else:
                    search_text = lower_text
                pre_text_words = re.findall(r'\b\w+\b', search_text[:phrase_start_idx])[-3:]
                is_negated = bool(set(pre_text_words) & self.negation_words)
                factor = 0.25 if is_negated else 1.0
                local_ctx = context_multiplier

                phrase_words = phrase.split()
                highlights.extend(phrase_words)
                for label, score in label_scores.items():
                    adjusted = score * factor * local_ctx
                    if adjusted > 0.15:
                        probs[label] = max(probs[label], adjusted)
                        all_scores.append(adjusted)

        # ── 3. Sarcasm detection ────────────────────────────────────────────
        for phrase in self.sarcasm_keywords:
            if phrase in lower_text:
                probs["Sarcasm"] = max(probs["Sarcasm"], 0.85)
                all_scores.append(0.75)
                highlights.extend(phrase.split())

        # ── 4. Risk score: blend of max score and top-3 average ────────────
        if all_scores:
            max_score = max(all_scores)
            top3_avg = sum(sorted(all_scores, reverse=True)[:3]) / min(3, len(all_scores))
            risk_score = (0.7 * max_score + 0.3 * top3_avg) * 100
        else:
            risk_score = 2.0  # near-zero for clean text

        # ── 5. Add slight noise to untouched baseline labels ───────────────
        for label in probs:
            if probs[label] <= 0.03:
                probs[label] += (len(text) % 7) * 0.005
            probs[label] = round(min(1.0, probs[label]), 4)

        # ── 6. Clean up highlights — remove safe/negated words ────────────
        highlights = [h for h in highlights
                      if h not in self.absolute_safe_words
                      and h not in self.context_reducers]

        return {
            "risk_score": round(risk_score, 2),
            "labels": probs,
            "highlights": list(set(highlights))
        }
