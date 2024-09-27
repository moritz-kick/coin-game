import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { useRef } from "react";

export default function Rules() {
  const videoRef = useRef(null);

  const handleSpeedChange = (speed) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  return (
    <div className="max-w-4xl mx-auto my-8">
      <Card className="flex flex-col lg:flex-row">
        {/* Rules Section */}
        <div className="lg:w-2/3 p-4">
          <CardHeader>
            <CardTitle className="text-center text-2xl font-bold">
              Patrik's Coin Game: Rules and Guidelines
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <section>
              <h2 className="text-xl font-semibold">Game Material</h2>
              <ul className="list-disc list-inside">
                <li>5 coins or similar small items</li>
                <li>2 players</li>
              </ul>
            </section>
            <section>
              <h2 className="text-xl font-semibold">Game Setup</h2>
              <ul className="list-disc list-inside">
                <li>One player is designated as the <strong>Coin Player</strong> and receives the coins.</li>
                <li>The other player becomes the <strong>Guesser</strong>.</li>
              </ul>
            </section>
            <section>
              <h2 className="text-xl font-semibold">Gameplay</h2>
              <p>The game consists of a maximum of 3 rounds. In each round:</p>
              <ol className="list-decimal list-inside ml-4">
                <li>The Coin Player secretly chooses between 0 and 5 coins.</li>
                <li>The Guesser attempts to guess the number of coins chosen.</li>
                <li>The Coin Player reveals the chosen coins at the end of each round.</li>
              </ol>
            </section>
            <section>
              <h2 className="text-xl font-semibold">Rules for Coin Selection</h2>
              <ul className="list-disc list-inside">
                <li>
                  The number of coins chosen must increase from round to round, with the following exceptions:
                  <ul className="list-disc list-inside ml-4">
                    <li>If 5 coins are chosen, the number remains the same in the next round.</li>
                    <li>The Coin Player is allowed to choose 0 coins once per game.</li>
                    <li>After a 0-coin round, the next choice must exceed the last non-zero choice.</li>
                  </ul>
                </li>
              </ul>
            </section>
            <section>
              <h2 className="text-xl font-semibold">Game End and Winning Conditions</h2>
              <ul className="list-disc list-inside">
                <li>The Coin Player wins if the Guesser guesses incorrectly in all three rounds.</li>
                <li>The Guesser wins as soon as they guess correctly in any round.</li>
              </ul>
            </section>
          </CardContent>
        </div>
      </Card>
    </div>
  );
}
