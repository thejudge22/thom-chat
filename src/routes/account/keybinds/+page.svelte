<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Kbd } from '$lib/components/ui/kbd';
	import {
		keybinds,
		KEYBIND_ACTIONS,
		KEYBIND_LABELS,
		DEFAULT_KEYBINDS,
		resetKeybind,
		resetAllKeybinds,
		updateKeybind,
		type KeybindAction,
		type KeybindConfig,
	} from '$lib/state/keybinds.svelte';
	import { formatKeybind, isMac } from '$lib/hooks/is-mac.svelte';
	import type { Key } from '$lib/actions/shortcut.svelte';
	import RotateCcwIcon from '~icons/lucide/rotate-ccw';

	let recording = $state<KeybindAction | null>(null);

	function startRecording(action: KeybindAction) {
		recording = action;
	}

	function stopRecording() {
		recording = null;
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (!recording) return;

		event.preventDefault();
		event.stopPropagation();

		// Ignore modifier-only keypresses
		if (['Control', 'Shift', 'Alt', 'Meta'].includes(event.key)) {
			return;
		}

		const config: KeybindConfig = {
			key: event.key.toLowerCase() as Key,
			ctrl: event.ctrlKey || event.metaKey,
			shift: event.shiftKey,
			alt: event.altKey,
		};

		updateKeybind(recording, config);
		stopRecording();
	}

	function isDefault(action: KeybindAction): boolean {
		const current = keybinds[action];
		const defaultConfig = DEFAULT_KEYBINDS[action];
		return (
			current.key === defaultConfig.key &&
			!!current.ctrl === !!defaultConfig.ctrl &&
			!!current.shift === !!defaultConfig.shift &&
			!!current.alt === !!defaultConfig.alt
		);
	}
</script>

<svelte:window onkeydown={handleKeyDown} />

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h2 class="text-2xl font-bold tracking-tight">Keyboard Shortcuts</h2>
			<p class="text-muted-foreground text-sm">
				Customize your keyboard shortcuts. Click on a keybind to change it.
			</p>
		</div>
		<Button variant="outline" size="sm" onclick={resetAllKeybinds}>
			<RotateCcwIcon class="mr-2 size-4" />
			Reset All
		</Button>
	</div>

	<div class="border-border rounded-lg border">
		{#each KEYBIND_ACTIONS as action, index (action)}
			{@const isRecordingThis = recording === action}
			{@const isDefaultValue = isDefault(action)}
			<div
				class="border-border flex items-center justify-between px-4 py-3 {index !==
				KEYBIND_ACTIONS.length - 1
					? 'border-b'
					: ''}"
			>
				<div class="flex flex-col">
					<span class="font-medium">{KEYBIND_LABELS[action]}</span>
					{#if !isDefaultValue}
						<span class="text-muted-foreground text-xs">Modified</span>
					{/if}
				</div>

				<div class="flex items-center gap-2">
					<button
						type="button"
						onclick={() => (isRecordingThis ? stopRecording() : startRecording(action))}
						class="border-input bg-muted/50 hover:bg-muted flex min-w-[140px] items-center justify-center gap-1 rounded-md border px-3 py-1.5 transition-colors {isRecordingThis
							? 'ring-ring ring-2 ring-offset-2'
							: ''}"
					>
						{#if isRecordingThis}
							<span class="text-muted-foreground animate-pulse text-sm">Press keys...</span>
						{:else}
							{#each formatKeybind(keybinds[action]) as key}
								<Kbd size="sm">{key}</Kbd>
							{/each}
						{/if}
					</button>

					{#if !isDefaultValue}
						<Button
							variant="ghost"
							size="icon"
							class="size-8"
							onclick={() => resetKeybind(action)}
							title="Reset to default"
						>
							<RotateCcwIcon class="size-4" />
						</Button>
					{/if}
				</div>
			</div>
		{/each}
	</div>

	<div class="text-muted-foreground space-y-2 text-sm">
		<p>
			<strong>Tip:</strong> Press {isMac ? '⌘' : 'Ctrl'} +{' '}
			<kbd class="bg-muted rounded px-1 font-mono">key</kbd> for ctrl/cmd shortcuts.
		</p>
		<p>Changes are saved automatically and will persist across browser sessions.</p>
	</div>
</div>
