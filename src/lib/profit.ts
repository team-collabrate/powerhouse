/*
  Profit calculation — computed in the app layer, not the database.

  DATA_MODEL.md originally specified these as Postgres GENERATED ALWAYS AS (...)
  STORED columns, but Postgres generated columns cannot reference other rows or
  run subqueries. TDD.md Decision 2 also lands on app-layer / event-driven
  computation. Keep this the single source of truth for the formula.

    total_team_cost = Σ (hours_logged × user.internal_cost_rate)
    total_expenses  = Σ project_expenses.amount
    total_cost      = total_team_cost + total_expenses + allocated_overhead
    profit          = contract_value - total_cost
    profit_margin   = contract_value > 0 ? profit / contract_value × 100 : 0
*/

export interface ProjectCostInputs {
  contractValue: number;
  allocatedOverhead: number;
  hours: { hoursLogged: number; internalCostRate: number }[];
  expenses: { amount: number }[];
}

export interface ProjectProfit {
  totalTeamCost: number;
  totalExpenses: number;
  totalCost: number;
  profit: number;
  profitMargin: number;
}

export function calculateProjectProfit(input: ProjectCostInputs): ProjectProfit {
  const totalTeamCost = input.hours.reduce(
    (sum, h) => sum + h.hoursLogged * h.internalCostRate,
    0,
  );
  const totalExpenses = input.expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalCost = totalTeamCost + totalExpenses + input.allocatedOverhead;
  const profit = input.contractValue - totalCost;
  const profitMargin =
    input.contractValue > 0 ? (profit / input.contractValue) * 100 : 0;

  return { totalTeamCost, totalExpenses, totalCost, profit, profitMargin };
}
