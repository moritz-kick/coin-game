import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronDown, ChevronUp, Search } from "lucide-react";
import { API, showErrorToast } from "@/lib/utils";

export default function Scoreboard() {
  const [scores, setScores] = useState([]);
  const [sortColumn, setSortColumn] = useState("winRate");
  const [sortDirection, setSortDirection] = useState("desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [scoreBoardType, setScoreBoardType] = useState("all");

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchScores();
  }, [scoreBoardType]);

  const fetchScores = async () => {
    // TODO: Implement fetching scores from the server

    try {
      const { data } = await API().get(
        `/user/scorecard?type=${scoreBoardType}`
      );

      setScores(data?.users);
    } catch (error) {
      console.log(error, "error");
      showErrorToast(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (column) => {
    if (column === sortColumn) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("desc");
    }
  };

  const sortedScores = [...scores].sort((a, b) => {
    if (a[sortColumn] < b[sortColumn]) return sortDirection === "asc" ? -1 : 1;
    if (a[sortColumn] > b[sortColumn]) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const filteredScores = sortedScores.filter((score) =>
    score.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const paginatedScores = filteredScores.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredScores.length / itemsPerPage);

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Scoreboard</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-5 mb-4">
          <Button
            onClick={() => setScoreBoardType("all")}
            variant={scoreBoardType === "all" ? "default" : "outline"}
          >
            All
          </Button>
          <Button
            onClick={() => setScoreBoardType("coin-players")}
            variant={scoreBoardType === "coin-players" ? "default" : "outline"}
          >
            Coin Players
          </Button>
          <Button
            onClick={() => setScoreBoardType("estimators")}
            variant={scoreBoardType === "estimators" ? "default" : "outline"}
          >
            Guessers
          </Button>
          {/* New Tabs for AI modes */}
          <Button
            onClick={() => setScoreBoardType("ai-easy")}
            variant={scoreBoardType === "ai-easy" ? "default" : "outline"}
          >
            Against AI (Easy)
          </Button>
          <Button
            onClick={() => setScoreBoardType("ai-hard")}
            variant={scoreBoardType === "ai-hard" ? "default" : "outline"}
          >
            Against AI (Hard)
          </Button>
        </div>

        <div className="flex items-center space-x-2 mb-4">
          <Input
            type="text"
            placeholder="Search players..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-grow"
          />
          <Button onClick={fetchScores} size="icon" variant="outline">
            <Search className="h-4 w-4" />
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                onClick={() => handleSort("username")}
                className="cursor-pointer"
              >
                Username{" "}
                {sortColumn === "username" &&
                  (sortDirection === "asc" ? (
                    <ChevronUp className="inline" />
                  ) : (
                    <ChevronDown className="inline" />
                  ))}
              </TableHead>
              <TableHead
                onClick={() => handleSort("wins")}
                className="cursor-pointer"
              >
                Wins{" "}
                {sortColumn === "wins" &&
                  (sortDirection === "asc" ? (
                    <ChevronUp className="inline" />
                  ) : (
                    <ChevronDown className="inline" />
                  ))}
              </TableHead>
              <TableHead
                onClick={() => handleSort("losses")}
                className="cursor-pointer"
              >
                Losses{" "}
                {sortColumn === "losses" &&
                  (sortDirection === "asc" ? (
                    <ChevronUp className="inline" />
                  ) : (
                    <ChevronDown className="inline" />
                  ))}
              </TableHead>
              <TableHead
                onClick={() => handleSort("winRate")}
                className="cursor-pointer"
              >
                Win Rate{" "}
                {sortColumn === "winRate" &&
                  (sortDirection === "asc" ? (
                    <ChevronUp className="inline" />
                  ) : (
                    <ChevronDown className="inline" />
                  ))}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedScores.map((score) => (
              <TableRow key={score.id}>
                <TableCell>{score.username}</TableCell>
                <TableCell>{score.wins}</TableCell>
                <TableCell>{score.losses}</TableCell>
                <TableCell>
                  {score.winRate ? +score?.winRate.toFixed(2) : 0}%
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="flex justify-between items-center mt-4">
          <div>
            Showing {(currentPage - 1) * itemsPerPage + 1} -{" "}
            {Math.min(currentPage * itemsPerPage, filteredScores.length)} of{" "}
            {filteredScores.length}
          </div>
          <div className="space-x-2">
            <Button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              size="sm"
            >
              Previous
            </Button>
            <Button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              size="sm"
            >
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
