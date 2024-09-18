import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

export default function Home() {
  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Welcome to Patrick's Game</CardTitle>
          <CardDescription>A game of strategy and guessing</CardDescription>
        </CardHeader>
        <CardContent>
          <p>
            Patrik's Coin Game is a two-player game where one player hides coins and the
            other tries to guess the number. It's a game of strategy and
            a bit of luck!
          </p>
          <div className="mt-4 space-x-4">
            <Button asChild>
              <Link to="/game">Play Against AI</Link>
            </Button>
            <Button asChild>
              <Link to="/login">Play Against a Friend</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>About the Game</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6"> {/* This will add larger gaps between the paragraphs */}
            <p>
              During a memorable biking tour with a friend through Mali Lošinj, a beautiful island in Croatia, I was introduced to a simple yet captivating game. The game was taught to us by a local named Patrik.
            </p>
            <p>
              My friend and I quickly got hooked on this simple yet strategic game, which only required a few coins, matches, or small stones to play. Even though it was easy to set up, the game was full of strategy and mind games.
            </p>
            <p>
              This experience inspired me to write my bachelor thesis, which will focus on analyzing the game’s strategic depth and behavioral patterns. I will probably link the thesis here once it's completed.
            </p>
            <p>
              In the meantime, I created this digital version of the game to gather data, which will help me train and improve algorithms for future iterations.
            </p>
            <p>
              To make this research a success, I need your help! By playing the game, you'll contribute valuable data for my study on human behavior in strategic decision-making.
            </p>
          </div>
          <div className="mt-4">
            <Button asChild variant="outline">
              <Link to="/rules">View Game Rules</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}