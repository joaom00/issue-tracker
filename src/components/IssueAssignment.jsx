import React from "react";
import { GoGear } from "react-icons/go";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { useUserData } from "../helpers/useUserData";

export default function IssueAssignment({ assignee, issueNumber }) {
  const queryClient = useQueryClient();
  const user = useUserData(assignee);
  const usersQuery = useQuery(["users"], () =>
    fetch("/api/users").then((res) => res.json())
  );

  const setAssignment = useMutation(
    (assignee) => {
      fetch(`/api/issues/${issueNumber}`, {
        method: "PUT",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ assignee }),
      }).then((res) => res.json());
    },
    {
      onMutate: (assignee) => {
        const oldAssignee = queryClient.getQueryData([
          "issues",
          issueNumber,
        ]).assignee;

        queryClient.setQueryData(["issues", issueNumber], (data) => ({
          ...data,
          assignee,
        }));

        return function rollback() {
          queryClient.setQueryData(["issues", issueNumber], (data) => ({
            ...data,
            assignee: oldAssignee,
          }));
        };
      },
      onError: (_error, _variables, rollback) => {
        rollback();
      },
      onSettled: () => {
        queryClient.invalidateQueries(["issues", issueNumber], { exact: true });
      },
    }
  );

  const [menuOpen, setMenuOpen] = React.useState(false);

  return (
    <div className="issue-options">
      <div>
        <span>Assignment</span>
        {user.isSuccess && (
          <div>
            <img src={user.data.profilePictureUrl} />
            {user.data.name}
          </div>
        )}
      </div>
      <GoGear
        onClick={() =>
          !usersQuery.isLoading &&
          setMenuOpen((currentMenuOpen) => !currentMenuOpen)
        }
      />
      {menuOpen && (
        <div className="picker-menu">
          {usersQuery.data?.map((user) => (
            <div key={user.id} onClick={() => setAssignment.mutate(user.id)}>
              <img src={user.profilePictureUrl} />
              {user.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
