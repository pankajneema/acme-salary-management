"""Static inputs for the demo seed: names by region, headcount mix and pay bands.

Pay bands are illustrative, not market data. They only need to be plausible enough
that the insights screens tell a coherent story.
"""

# fmt: off
NAMES_BY_REGION: dict[str, tuple[tuple[str, ...], tuple[str, ...]]] = {
    "anglo": (
        ("James", "Olivia", "Liam", "Emma", "Noah", "Ava", "Ethan", "Sophia", "Mason", "Isabella",
         "Lucas", "Mia", "Oliver", "Amelia", "Jack", "Harper", "Henry", "Grace", "Leo", "Chloe"),
        ("Smith", "Johnson", "Williams", "Brown", "Jones", "Miller", "Davis", "Wilson", "Taylor",
         "Anderson", "Thomas", "Moore", "Martin", "Clark", "Lewis", "Walker", "Hall", "Young",
         "King", "Wright"),
    ),
    "german": (
        ("Lukas", "Anna", "Felix", "Lea", "Jonas", "Hannah", "Maximilian", "Lena", "Paul", "Marie",
         "Leon", "Laura", "Finn", "Julia", "Elias", "Sarah", "Moritz", "Katharina", "Tim", "Clara"),
        ("Müller", "Schmidt", "Schneider", "Fischer", "Weber", "Meyer", "Wagner", "Becker",
         "Schulz", "Hoffmann", "Koch", "Richter", "Klein", "Wolf", "Neumann", "Schwarz",
         "Zimmermann", "Braun", "Hartmann", "Krüger"),
    ),
    "french": (
        ("Gabriel", "Louise", "Raphaël", "Jade", "Arthur", "Alice", "Louis", "Chloé", "Jules",
         "Léa", "Adam", "Manon", "Hugo", "Camille", "Nathan", "Inès", "Théo", "Zoé", "Tom",
         "Juliette"),
        ("Martin", "Bernard", "Dubois", "Thomas", "Robert", "Richard", "Petit", "Durand", "Leroy",
         "Moreau", "Simon", "Laurent", "Lefebvre", "Michel", "Garcia", "David", "Bertrand",
         "Roux", "Vincent", "Fournier"),
    ),
    "indian": (
        ("Aarav", "Ananya", "Vivaan", "Diya", "Aditya", "Isha", "Arjun", "Priya", "Rohan", "Kavya",
         "Rahul", "Sneha", "Vikram", "Pooja", "Karan", "Neha", "Siddharth", "Meera", "Aman",
         "Riya"),
        ("Sharma", "Verma", "Patel", "Iyer", "Reddy", "Nair", "Gupta", "Singh", "Kumar", "Rao",
         "Joshi", "Mehta", "Desai", "Chopra", "Kapoor", "Menon", "Pillai", "Bose", "Das",
         "Agarwal"),
    ),
    "japanese": (
        ("Haruto", "Yui", "Sota", "Hina", "Yuto", "Aoi", "Riku", "Sakura", "Kaito", "Mei",
         "Ren", "Yuna", "Takumi", "Rin", "Daiki", "Miyu", "Kenta", "Saki", "Shota", "Nanami"),
        ("Sato", "Suzuki", "Takahashi", "Tanaka", "Watanabe", "Ito", "Yamamoto", "Nakamura",
         "Kobayashi", "Kato", "Yoshida", "Yamada", "Sasaki", "Yamaguchi", "Matsumoto", "Inoue",
         "Kimura", "Hayashi", "Shimizu", "Mori"),
    ),
    "brazilian": (
        ("Miguel", "Helena", "Arthur", "Alice", "Heitor", "Laura", "Bernardo", "Manuela", "Davi",
         "Valentina", "Gabriel", "Sophia", "Pedro", "Isabela", "Lorenzo", "Luiza", "Matheus",
         "Beatriz", "Rafael", "Mariana"),
        ("Silva", "Santos", "Oliveira", "Souza", "Rodrigues", "Ferreira", "Alves", "Pereira",
         "Lima", "Gomes", "Costa", "Ribeiro", "Martins", "Carvalho", "Almeida", "Lopes", "Soares",
         "Fernandes", "Vieira", "Barbosa"),
    ),
    "singaporean": (
        ("Wei Ling", "Jun Jie", "Hui Min", "Wei Jie", "Mei Ling", "Zhi Hao", "Siti", "Muhammad",
         "Nurul", "Ahmad", "Priya", "Arun", "Jia Hui", "Kai Wen", "Xin Yi", "Rui En", "Farah",
         "Hafiz", "Divya", "Ravi"),
        ("Tan", "Lim", "Lee", "Ng", "Ong", "Wong", "Goh", "Chua", "Chan", "Koh", "Teo", "Ang",
         "Yeo", "Tay", "Ho", "Rahman", "Ismail", "Abdullah", "Krishnan", "Subramaniam"),
    ),
}
# fmt: on

# Country -> (name region, share of headcount, pay factor relative to US in USD terms).
COUNTRY_PROFILES: dict[str, tuple[str, float, float]] = {
    "US": ("anglo", 0.25, 1.00),
    "IN": ("indian", 0.20, 0.30),
    "GB": ("anglo", 0.10, 0.75),
    "DE": ("german", 0.08, 0.80),
    "CA": ("anglo", 0.07, 0.80),
    "FR": ("french", 0.06, 0.70),
    "AU": ("anglo", 0.06, 0.80),
    "SG": ("singaporean", 0.06, 0.85),
    "JP": ("japanese", 0.06, 0.65),
    "BR": ("brazilian", 0.06, 0.35),
}

# Job title -> (share of headcount, US base salary band in USD).
JOB_PROFILES: dict[str, tuple[float, tuple[int, int]]] = {
    "Software Engineer": (0.18, (95_000, 150_000)),
    "Senior Software Engineer": (0.10, (140_000, 200_000)),
    "Engineering Manager": (0.03, (170_000, 240_000)),
    "QA Engineer": (0.05, (75_000, 115_000)),
    "DevOps Engineer": (0.04, (105_000, 160_000)),
    "Data Analyst": (0.05, (70_000, 110_000)),
    "Data Scientist": (0.04, (115_000, 175_000)),
    "Product Manager": (0.04, (120_000, 185_000)),
    "Product Designer": (0.03, (95_000, 145_000)),
    "Account Executive": (0.07, (65_000, 120_000)),
    "Sales Manager": (0.03, (110_000, 170_000)),
    "Marketing Specialist": (0.04, (55_000, 85_000)),
    "Marketing Manager": (0.02, (95_000, 145_000)),
    "Accountant": (0.03, (60_000, 90_000)),
    "Financial Analyst": (0.03, (70_000, 110_000)),
    "HR Generalist": (0.03, (55_000, 85_000)),
    "Recruiter": (0.03, (55_000, 90_000)),
    "Customer Support Specialist": (0.10, (40_000, 60_000)),
    "Operations Coordinator": (0.06, (45_000, 70_000)),
}
