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
          <CardTitle>Welcome to Coin Game</CardTitle>
          <CardDescription>A game of strategy and guessing</CardDescription>
        </CardHeader>
        <CardContent>
          <p>
            Coin Game is a two-player game where one player hides coins and the
            other tries to guess the number. Its a game of strategy, memory, and
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
          <p>Coin Game originated in... [Add your introduction text here]</p>
        </CardContent>
      </Card>
    </div>
  );
}
