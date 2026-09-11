/*
  Profit calculation: computed in the app layer, not the database.
  (Postgres generated columns can't run cross-table subqueries.)

  Projects are contract + duration based; there is no time logging. Team cost
  is a single estimated figure entered on the project.

    total_cost    = team_cost + Σ project_expenses.amount + allocated_overhead
    profit        = contract_value - total_cost
    profit_margin = contract_value > 0 ? profit / contract_value × 100 : 0
*/

export interface ProjectCostInputs {
  contractValue: number;
  teamCost: number;
  allocatedOverhead: number;
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
  const totalTeamCost = input.teamCost;
  const totalExpenses = input.expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalCost = totalTeamCost + totalExpenses + input.allocatedOverhead;
  const profit = input.contractValue - totalCost;
  const profitMargin =
    input.contractValue > 0 ? (profit / input.contractValue) * 100 : 0;

  return { totalTeamCost, totalExpenses, totalCost, profit, profitMargin };
}
