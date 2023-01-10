import React from "react";
import { GoGear } from "react-icons/go";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { useUserData } from "../helpers/useUserData";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

export default function IssueAssignment({ assignee, issueNumber }) {
  const queryClient = useQueryClient();
  const user = useUserData(assignee);
  const usersQuery = useQuery(["users"], () =>
    fetch("/api/users").then((res) => res.json())
  );

  const setAssignment = useMutation(
    (assignee) => {
      return fetch(`/api/issues/${issueNumber}`, {
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
      <DropdownMenu.Root>
        <DropdownMenu.Trigger className="DropdownMenuTrigger">
          <GoGear />
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content className="DropdownMenuContent" align="end">
            {usersQuery.data?.map((user) => (
              <DropdownMenu.Item
                key={user.id}
                className="DropdownMenuItem"
                onSelect={() => setAssignment.mutate(user.id)}
              >
                <img src={user.profilePictureUrl} />
                {user.name}
              </DropdownMenu.Item>
            ))}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  );
}
