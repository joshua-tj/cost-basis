import { useState } from "react";
import { useSnapshot } from "valtio";
import {
  store,
  addGroup,
  removeGroup,
  updateGroup,
  allPlanTypes,
} from "../store";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export function GroupManager() {
  const snap = useSnapshot(store);
  const ticker = snap.tickers[snap.activeSymbol];
  if (!ticker) return null;

  const planTypes = allPlanTypes();
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPlanTypes, setNewPlanTypes] = useState<string[]>([]);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editPlanTypes, setEditPlanTypes] = useState<string[]>([]);

  const togglePlanType = (
    pt: string,
    selected: string[],
    setSelected: (pts: string[]) => void
  ) => {
    if (selected.includes(pt)) {
      setSelected(selected.filter((p) => p !== pt));
    } else {
      setSelected([...selected, pt]);
    }
  };

  const handleAdd = () => {
    if (!newName.trim() || newPlanTypes.length === 0) return;
    addGroup(newName.trim(), newPlanTypes);
    setNewName("");
    setNewPlanTypes([]);
    setAdding(false);
  };

  const handleStartEdit = (idx: number) => {
    const g = ticker.groups[idx];
    setEditingIdx(idx);
    setEditName(g.name);
    setEditPlanTypes([...g.planTypes]);
  };

  const handleSaveEdit = () => {
    if (editingIdx === null || !editName.trim() || editPlanTypes.length === 0)
      return;
    updateGroup(editingIdx, editName.trim(), editPlanTypes);
    setEditingIdx(null);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Groups</CardTitle>
            <CardDescription>
              Separate lots by plan type. Plans not in a group go to "Rest".
              Available: {planTypes.join(", ")}
            </CardDescription>
          </div>
          {!adding && (
            <Button variant="outline" size="sm" onClick={() => setAdding(true)}>
              + Add Group
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {ticker.groups.map((group, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between rounded-lg border p-3"
          >
            {editingIdx === idx ? (
              <div className="flex flex-col gap-2 w-full">
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Group name"
                  className="w-48"
                />
                <div className="flex gap-1.5 flex-wrap">
                  {planTypes.map((pt) => (
                    <Badge
                      key={pt}
                      variant={
                        editPlanTypes.includes(pt) ? "default" : "outline"
                      }
                      className="cursor-pointer select-none"
                      onClick={() =>
                        togglePlanType(pt, editPlanTypes, setEditPlanTypes)
                      }
                    >
                      {pt}
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveEdit}>
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditingIdx(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <span className="font-medium">{group.name}</span>
                  <div className="flex gap-1">
                    {group.planTypes.map((pt) => (
                      <Badge key={pt} variant="secondary" className="text-xs">
                        {pt}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleStartEdit(idx)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => removeGroup(idx)}
                  >
                    Remove
                  </Button>
                </div>
              </>
            )}
          </div>
        ))}

        {adding && (
          <div className="rounded-lg border border-dashed p-3 space-y-2">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Group name"
              className="w-48"
              autoFocus
            />
            <div className="flex gap-1.5 flex-wrap">
              {planTypes.map((pt) => (
                <Badge
                  key={pt}
                  variant={newPlanTypes.includes(pt) ? "default" : "outline"}
                  className="cursor-pointer select-none"
                  onClick={() =>
                    togglePlanType(pt, newPlanTypes, setNewPlanTypes)
                  }
                >
                  {pt}
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAdd}>
                Add
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setAdding(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {ticker.groups.length === 0 && !adding && (
          <p className="text-sm text-muted-foreground py-2">
            No custom groups. All lots are in "Rest".
          </p>
        )}
      </CardContent>
    </Card>
  );
}
