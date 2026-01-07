<script lang="ts">
	import type { NanoGPTModel } from '$lib/backend/models/nano-gpt';
	import {
		supportsVision,
		supportsReasoning,
		isImageOnlyModel,
		supportsVideo,
	} from '$lib/utils/model-capabilities';
	import { cn } from '$lib/utils/utils';
	import EyeIcon from '~icons/lucide/eye';
	import BrainIcon from '~icons/lucide/brain';
	import ImageIcon from '~icons/lucide/image';
	import VideoIcon from '~icons/lucide/video';
	import XIcon from '~icons/lucide/x';
	import CheckIcon from '~icons/lucide/check';

	type Props = {
		model: NanoGPTModel;
		iconUrl?: string;
		onClose: () => void;
	};

	let { model, iconUrl, onClose }: Props = $props();

	function formatNumber(num: number | undefined): string {
		if (!num) return '-';
		if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
		if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
		return num.toString();
	}

	function formatDate(timestamp: number | undefined): string {
		if (!timestamp) return '-';
		return new Date(timestamp * 1000).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
		});
	}

	function formatPrice(price: string | undefined): string {
		if (!price) return '-';
		const num = parseFloat(price);
		if (isNaN(num)) return '-';
		if (num === 0) return 'Free';
		return `$${num.toFixed(2)}`;
	}

	function getProviderName(ownedBy: string | undefined): string {
		if (!ownedBy) return 'Unknown';
		// Clean up common patterns
		return ownedBy
			.replace('organization-owner', 'Third Party')
			.split('-')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
	}
</script>

<div class="bg-popover border-border flex h-full w-[320px] flex-col overflow-hidden border-l">
	<!-- Header -->
	<div class="border-border flex items-start gap-3 border-b p-4">
		{#if iconUrl}
			<img src={iconUrl} alt="" class="size-10 flex-shrink-0 object-contain" />
		{:else}
			<div class="bg-muted text-muted-foreground flex size-10 items-center justify-center rounded">
				?
			</div>
		{/if}
		<div class="min-w-0 flex-1">
			<h3 class="truncate text-base font-semibold">{model.name}</h3>
			<p class="text-muted-foreground truncate text-xs">{model.id}</p>
		</div>
		<button class="hover:bg-accent flex-shrink-0 rounded p-1 transition-colors" onclick={onClose}>
			<XIcon class="size-4" />
		</button>
	</div>

	<!-- Content -->
	<div class="flex-1 space-y-4 overflow-y-auto p-4">
		<!-- Description -->
		{#if model.description}
			<div>
				<h4 class="text-muted-foreground mb-1 text-xs font-medium tracking-wide uppercase">
					Description
				</h4>
				<p class="text-sm">{model.description}</p>
			</div>
		{/if}

		<!-- Features -->
		<div>
			<h4 class="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
				Features
			</h4>
			<div class="flex flex-wrap gap-2">
				{#if supportsVision(model)}
					<span
						class="inline-flex items-center gap-1.5 rounded-full bg-purple-500/20 px-2.5 py-1 text-xs text-purple-400"
					>
						<EyeIcon class="size-3" />
						Vision
					</span>
				{/if}
				{#if supportsReasoning(model)}
					<span
						class="inline-flex items-center gap-1.5 rounded-full bg-green-500/20 px-2.5 py-1 text-xs text-green-400"
					>
						<BrainIcon class="size-3" />
						Reasoning
					</span>
				{/if}
				{#if isImageOnlyModel(model)}
					<span
						class="inline-flex items-center gap-1.5 rounded-full bg-blue-500/20 px-2.5 py-1 text-xs text-blue-400"
					>
						<ImageIcon class="size-3" />
						Image Gen
					</span>
				{/if}
				{#if supportsVideo(model)}
					<span
						class="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/20 px-2.5 py-1 text-xs text-cyan-400"
					>
						<VideoIcon class="size-3" />
						Video Gen
					</span>
				{/if}
				{#if !supportsVision(model) && !supportsReasoning(model) && !isImageOnlyModel(model) && !supportsVideo(model)}
					<span class="text-muted-foreground text-xs">No special features</span>
				{/if}
			</div>
		</div>

		<!-- Provider & Context -->
		<div class="grid grid-cols-2 gap-4">
			<div>
				<h4 class="text-muted-foreground mb-1 text-xs font-medium tracking-wide uppercase">
					Provider
				</h4>
				<p class="text-sm">{getProviderName(model.owned_by)}</p>
			</div>
			<div>
				<h4 class="text-muted-foreground mb-1 text-xs font-medium tracking-wide uppercase">
					Context
				</h4>
				<p class="text-sm">{formatNumber(model.context_length)} tokens</p>
			</div>
		</div>

		<!-- Max Output & Added -->
		<div class="grid grid-cols-2 gap-4">
			<div>
				<h4 class="text-muted-foreground mb-1 text-xs font-medium tracking-wide uppercase">
					Max Output
				</h4>
				<p class="text-sm">{formatNumber(model.max_output_tokens)} tokens</p>
			</div>
			<div>
				<h4 class="text-muted-foreground mb-1 text-xs font-medium tracking-wide uppercase">
					Added
				</h4>
				<p class="text-sm">{formatDate(model.created)}</p>
			</div>
		</div>

		<!-- Pricing -->
		{#if model.pricing}
			<div>
				<h4 class="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
					Pricing
				</h4>
				<div class="bg-muted/50 space-y-2 rounded-lg p-3">
					<div class="flex justify-between text-sm">
						<span class="text-muted-foreground">Input</span>
						<span>{formatPrice(model.pricing.prompt)} / 1M tokens</span>
					</div>
					<div class="flex justify-between text-sm">
						<span class="text-muted-foreground">Output</span>
						<span>{formatPrice(model.pricing.completion)} / 1M tokens</span>
					</div>
					{#if model.cost_estimate}
						<div class="border-border flex justify-between border-t pt-2 text-sm">
							<span class="text-muted-foreground">Est. per message</span>
							<span class="text-green-400">${model.cost_estimate.toFixed(4)}</span>
						</div>
					{/if}
				</div>
			</div>
		{/if}

		<!-- Subscription -->
		{#if model.subscription}
			<div>
				<h4 class="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
					Subscription
				</h4>
				<div
					class={cn(
						'flex items-center gap-2 rounded-lg px-3 py-2 text-sm',
						model.subscription.included
							? 'bg-green-500/10 text-green-400'
							: 'bg-yellow-500/10 text-yellow-400'
					)}
				>
					{#if model.subscription.included}
						<CheckIcon class="size-4" />
					{:else}
						<XIcon class="size-4" />
					{/if}
					<span
						>{model.subscription.note ||
							(model.subscription.included ? 'Included in subscription' : 'Not included')}</span
					>
				</div>
			</div>
		{/if}
	</div>
</div>
