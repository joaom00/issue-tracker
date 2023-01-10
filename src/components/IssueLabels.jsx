import React from "react";
import { useQueryClient, useMutation } from "react-query";
import { GoGear } from "react-icons/go";
import { useLabelData } from "../helpers/useLabelData";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

export default function IssueLabels({ labels, issueNumber }) {
  const labelsQuery = useLabelData();

  const queryClient = useQueryClient();
  const setLabels = useMutation(
    (labelId) => {
      const newLabels = labels.includes(labelId)
        ? labels.filter((currentLabel) => currentLabel !== labelId)
        : [...labels, labelId];
      return fetch(`/api/issues/${issueNumber}`, {
        method: "PUT",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ labels: newLabels }),
      }).then((res) => res.json());
    },
    {
      onMutate: (labelId) => {
        const oldLabels = queryClient.getQueryData([
          "issues",
          issueNumber,
        ]).labels;
        const newLabels = oldLabels.includes(labelId)
          ? oldLabels.filter((label) => label !== labelId)
          : [...oldLabels, labelId];

        queryClient.setQueryData(["issues", issueNumber], (data) => ({
          ...data,
          labels: newLabels,
        }));

        return function rollback() {
          queryClient.setQueryData(["issues", issueNumber], (data) => {
            const rollbackLabels = oldLabels.includes(labelId)
              ? [...data.labels]
              : data.labels.filter((label) => label !== labelId);
            return {
              ...data,
              labels: rollbackLabels,
            };
          });
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
        <span>Labels</span>
        {labelsQuery.isLoading
          ? null
          : labels.map((label) => {
              const labelObject = labelsQuery.data.find(
                (queryLabel) => queryLabel.id === label
              );
              if (!labelObject) return null;
              return (
                <span key={label} className={`label ${labelObject.color}`}>
                  {labelObject.name}
                </span>
              );
            })}
      </div>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger
          className="DropdownMenuTrigger"
          disabled={labelsQuery.isLoading}
        >
          <GoGear />
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content className="DropdownMenuContent">
            {labelsQuery.data?.map((label) => {
              const selected = labels.includes(label.id);
              return (
                <DropdownMenu.Item
                  key={label.id}
                  className={`${selected ? "selected" : ""} DropdownMenuItem`}
                  onSelect={() => setLabels.mutate(label.id)}
                >
                  <span
                    className="label-dot"
                    style={{ backgroundColor: label.color }}
                  />
                  {label.name}
                </DropdownMenu.Item>
              );
            })}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  );
}
