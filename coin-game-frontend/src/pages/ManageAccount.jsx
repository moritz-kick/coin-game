import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useAppContext } from "@/context/AppContext";
import { toast } from "sonner";

export default function ManageAccount() {
  const { user, deleteUserAccount, changeUsername } = useAppContext();
  const [confirmUsername, setConfirmUsername] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = () => {
    if (confirmUsername !== user.username) {
      toast.error("Usernames do not match");
      return;
    }

    deleteUserAccount();
  };

  const handleChangeUsername = async () => {
    if (!newUsername) {
      toast.error("Username cannot be empty");
      return;
    }

    changeUsername(newUsername);
    setNewUsername("");
    toast.success("Username updated successfully");
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Manage Your Account</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            placeholder="New Username"
          />
          <Button onClick={handleChangeUsername} className="mt-2">
            Change Username
          </Button>

          <Button
            variant="destructive"
            onClick={() => setIsDeleting(true)}
            className="mt-4"
          >
            Delete Account
          </Button>

          {isDeleting && (
            <div className="mt-2">
              <p>Please type your username to confirm:</p>
              <Input
                value={confirmUsername}
                onChange={(e) => setConfirmUsername(e.target.value)}
                placeholder="Username"
              />
              <Button variant="destructive" onClick={handleDeleteAccount}>
                Confirm Delete
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}