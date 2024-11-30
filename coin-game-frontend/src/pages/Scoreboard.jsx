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
  const [sortColumn, setSortColumn] = useState("wins");
  const [sortDirection, setSortDirection] = useState("desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const itemsPerPage = 10;

  const [scoreBoardType, setScoreBoardType] = useState("human");

  useEffect(() => {
    fetchScores();
  }, [scoreBoardType]);

  const fetchScores = async () => {
    setLoading(true);
    try {
      const { data } = await API().get(
        `/user/scorecard?type=${scoreBoardType}`
      );
      setScores(data?.users || []);
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
    let comparison = 0;

    const aWins =
      scoreBoardType === "human"
        ? a.wins
        : scoreBoardType === "ai"
        ? a.aiWins
        : 0; // Default to 0 for any unforeseen type
    const bWins =
      scoreBoardType === "human"
        ? b.wins
        : scoreBoardType === "ai"
        ? b.aiWins
        : 0;

    const aLosses =
      scoreBoardType === "human"
        ? a.losses
        : scoreBoardType === "ai"
        ? a.aiLosses
        : 0;
    const bLosses =
      scoreBoardType === "human"
        ? b.losses
        : scoreBoardType === "ai"
        ? b.aiLosses
        : 0;

    const aWinRate = aWins + aLosses > 0 ? (aWins / (aWins + aLosses)) * 100 : 0;
    const bWinRate = bWins + bLosses > 0 ? (bWins / (bWins + bLosses)) * 100 : 0;

    if (sortColumn === "winRate") {
      if (aWinRate !== bWinRate) {
        comparison =
          sortDirection === "asc" ? aWinRate - bWinRate : bWinRate - aWinRate;
      } else {
        const aTotalGames = aWins + aLosses;
        const bTotalGames = bWins + bLosses;
        comparison = bTotalGames - aTotalGames;
      }
    } else if (sortColumn === "wins") {
      if (aWins !== bWins) {
        comparison = sortDirection === "asc" ? aWins - bWins : bWins - aWins;
      } else {
        if (aWinRate !== bWinRate) {
          comparison =
            sortDirection === "asc" ? aWinRate - bWinRate : bWinRate - aWinRate;
        } else {
          const aTotalGames = aWins + aLosses;
          const bTotalGames = bWins + bLosses;
          comparison = bTotalGames - aTotalGames;
        }
      }
    } else {
      // Default comparison for other columns
      if (a[sortColumn] < b[sortColumn])
        comparison = sortDirection === "asc" ? -1 : 1;
      else if (a[sortColumn] > b[sortColumn])
        comparison = sortDirection === "asc" ? 1 : -1;
      else comparison = 0;
    }

    return comparison;
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
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {["human", "ai"].map((type) => (
            <Button
              key={type}
              onClick={() => {
                setScoreBoardType(type);
                setCurrentPage(1);
              }}
              variant={scoreBoardType === type ? "default" : "outline"}
            >
              {type === "human" ? "Human" : "AI"}
            </Button>
          ))}
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

        {loading ? (
          <p>Loading...</p>
        ) : (
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
              {paginatedScores.map((score) => {
                const wins =
                  scoreBoardType === "human"
                    ? score.wins
                    : scoreBoardType === "ai"
                    ? score.aiWins
                    : 0; // Default to 0 for any unforeseen type
                const losses =
                  scoreBoardType === "human"
                    ? score.losses
                    : scoreBoardType === "ai"
                    ? score.aiLosses
                    : 0;
                const winRate =
                  wins + losses > 0 ? (wins / (wins + losses)) * 100 : 0;

                return (
                  <TableRow key={score.id}>
                    <TableCell>{score.username}</TableCell>
                    <TableCell>{wins}</TableCell>
                    <TableCell>{losses}</TableCell>
                    <TableCell>{winRate.toFixed(2)}%</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}

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
