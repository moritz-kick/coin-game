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
              <p>The game consists of a maximum of <strong>3 rounds</strong>. In each round:</p>
              <ol className="list-decimal list-inside ml-4">
                <li>The Coin Player secretly <strong>chooses</strong> between 0 and 5 coins.</li>
                <li>The Guesser attempts to <strong>guess</strong> the number of coins chosen.</li>
                <li>The Coin Player reveals the chosen coins at the end of each round.</li>
              </ol>
            </section>
            <section>
              <h2 className="text-xl font-semibold">Rules for Coin Selection</h2>
              <ul className="list-disc list-inside">
                <li>
                  The number of coins chosen <strong>must increase</strong> from round to round, with the following exceptions:
                  <ul className="list-disc list-inside ml-4">
                    <li>If <strong>5</strong> coins are chosen, <strong>5</strong> can be choosen in the <strong>next round again</strong> .</li>
                    <li>The Coin Player is allowed to choose <strong>0</strong> coins once per game in <strong>any round</strong>.</li>
                    <li>After a <strong>0-coin</strong> round, the next choice must be <strong>higher than the last non-zero choice</strong>.</li>
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

        {/* Video Section */}
        <div className="lg:w-1/3 p-4">
          <video
            ref={videoRef}
            src="/videos/game-demo.mp4"
            controls
            className="w-full h-auto"
          >
            Your browser does not support the video tag.
          </video>
          {/* Speed Control Buttons */}
          <div className="flex justify-center space-x-4 mt-4">
            <button
              onClick={() => handleSpeedChange(0.5)}
              className="px-4 py-2 bg-blue-500 text-white rounded-md"
            >
              0.5x
            </button>
            <button
              onClick={() => handleSpeedChange(1)}
              className="px-4 py-2 bg-blue-500 text-white rounded-md"
            >
              1x
            </button>
            <button
              onClick={() => handleSpeedChange(1.5)}
              className="px-4 py-2 bg-blue-500 text-white rounded-md"
            >
              1.5x
            </button>
            <button
              onClick={() => handleSpeedChange(2)}
              className="px-4 py-2 bg-blue-500 text-white rounded-md"
            >
              2x
            </button>
          </div>

          {/* Caption */}
          <p className="mt-4 text-center text-sm italic">
            Yes, folks, you're watching the legendary Patrik himself explain his genius game. ;)
          </p>
        </div>
      </Card>
    </div>
  );
}
