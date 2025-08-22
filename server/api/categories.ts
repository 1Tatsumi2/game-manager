export default defineEventHandler(async (event) => {
  // Return list of game categories
  return [
    { label: "All Categories", value: "" },
    { label: "MMORPG", value: "MMORPG" },
    { label: "RPG", value: "RPG" },
    { label: "Action", value: "Action" },
    { label: "Strategy", value: "Strategy" },
    { label: "Simulation", value: "Simulation" },
    { label: "Adventure", value: "Adventure" },
    { label: "Puzzle", value: "Puzzle" },
    { label: "Sports", value: "Sports" },
    { label: "Racing", value: "Racing" },
    { label: "Other", value: "Other" },
  ];
});
