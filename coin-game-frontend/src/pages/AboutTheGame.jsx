import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
  } from "@/components/ui/card";
  import { Button } from "@/components/ui/button";
  import { Link } from "react-router-dom";
  
  export default function AboutTheGame() {
    return (
      <div className="max-w-4xl mx-auto my-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-2xl font-bold">
              About Patrik's Coin Game
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
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
            <div className="mt-4 text-center">
              <Button asChild variant="outline">
                <Link to="/rules">View Game Rules</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  