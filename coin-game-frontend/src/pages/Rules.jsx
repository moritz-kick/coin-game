import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../components/ui/card";

export default function Rules() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Game Rules</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <section>
          <h3 className="text-lg font-semibold">Player Roles and Material</h3>
          <ul className="list-disc list-inside">
            <li>Game Material: 5 coins</li>
            <li>Players: 2 persons</li>
            <li>Roles: Coin Player and Estimator</li>
          </ul>
        </section>
        <section>
          <h3 className="text-lg font-semibold">Gameplay</h3>
          <ul className="list-disc list-inside">
            <li>The game consists of a maximum of 3 rounds</li>
            <li>
              In each round:
              <ul className="list-disc list-inside ml-4">
                <li>The Coin Player secretly chooses between 1 and 5 coins</li>
                <li>The Estimator attempts to guess the number of coins</li>
                <li>The Coin Player reveals the chosen coins</li>
              </ul>
            </li>
          </ul>
        </section>
        {/* Add more sections for Coin Number Rules, End of the Game, etc. */}
      </CardContent>
    </Card>
  );
}
