import { Dataset } from "../lib/types";
import { DatasetHeader } from "./DatasetHeader";

export default function DatasetTokenInput({
    onSubmit,
    dataset,
}: {
    onSubmit: (type: string) => void;
    dataset: Dataset;
}) {
    return (
        <div className="flex flex-col gap-8 items-start">
            <DatasetHeader dataset={dataset}>{dataset.name}</DatasetHeader>
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    const token = ((e.target as any)?.token as HTMLInputElement)
                        ?.value;
                    // TODO: Consider using zod
                    if (token && typeof token === "string") {
                        onSubmit(token);
                    }
                }}
            >
                <div className="flex flex-col gap-2 items-start">
                    <label>Token:</label>
                    <input
                        name="token"
                        type="password"
                        className="px-2 py-1 border rounded-md w-96 max-w-full"
                        // Hack to get browsers to not save this "password" field
                        autoComplete="off"
                        readOnly
                        onFocus={(e) => e.target.removeAttribute("readonly")}
                        onBlur={(e) => e.target.setAttribute("readonly", "")}
                    />
                    <button className="bg-gray-200 hover:bg-gray-300 active:bg-gray-400 px-2 py-1 rounded-md">
                        Save
                    </button>
                </div>
            </form>
        </div>
    );
}
