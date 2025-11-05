-- D1 schema
CREATE TABLE IF NOT EXISTS inventory (
	cat TEXT NOT NULL,
	id TEXT NOT NULL,
	name TEXT,
	price INTEGER,
	quantity INTEGER,
	PRIMARY KEY (cat, id)
);

CREATE TABLE IF NOT EXISTS configs (
	cpuType TEXT NOT NULL,
	game TEXT NOT NULL,
	budgetKey TEXT NOT NULL,
	payload TEXT NOT NULL,
	PRIMARY KEY (cpuType, game, budgetKey)
);
