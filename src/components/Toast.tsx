import { Toast } from "radix-ui";

export default () => (
	<Toast.Provider>
		<Toast.Root>
			<Toast.Title />
			<Toast.Description />
			<Toast.Action />
			<Toast.Close />
		</Toast.Root>

		<Toast.Viewport />
	</Toast.Provider>
);
