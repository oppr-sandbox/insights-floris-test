'use client'

import { Badge } from "@/components/ui/badge";
import { TopicAction, TopicDetailProvider, useTopicDetail, } from "./hooks/useTopicDetail";
import { Button } from "@/components/ui/button";
import { DetailsMode } from "./components/details-mode";
import { TopicStatus } from "../data/schema";
import { EditMode } from "./components/edit-mode";
import { useEffect, useState } from "react";
import { statuses } from "../data/data";
import NotFound from "./not-found";
import Loading from "./loading";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
	AlertDialog,
	AlertDialogTrigger,
	AlertDialogContent,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogCancel,
	AlertDialogAction,
} from '@/components/ui/alert-dialog'
import { useQueryClient } from "@tanstack/react-query";
import { Link, Pause } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { setQueryParam } from "@/utils/helpers/helpers";
import { useUserDetails } from "@/providers/UserContextProvider";

function getAvailableActions(status: TopicStatus) {
	const isDraft = status === TopicStatus.Draft
	const isEditable = status === TopicStatus.Active || status === TopicStatus.Paused

	const publishAction: TopicAction = isDraft ? 'Publish' : 'Save and Publish'

	return { isDraft, isEditable, publishAction }
}

const EditHeader = ({ onCancel, onSave, onPublish }: { onCancel: () => void, onSave: () => void, onPublish: () => void }) => {
	const { tenant, hasActiveSubscription } = useUserDetails()
	const { data, hasChanges, isSaving, isPublishing } = useTopicDetail()
	const { isDraft, isEditable, publishAction } = getAvailableActions(data!.status)
	const router = useRouter()

	return (
		<div className="flex items-center justify-between lg:justify-end space-x-2 w-full">
			<p className='text-xs text-muted-foreground '>
				{isSaving ? 'Saving...' : isDraft ? 'Auto-saved changes' : ''}
			</p>
			<div className="space-x-2">
				{data!.status == TopicStatus.Draft && (
					<Button size='sm' disabled={isSaving || isPublishing} onClick={() => router.push(`/${tenant}/topics`)}>Back</Button>
				)}
				{isEditable && (
					<>
						{hasChanges ? (
							<AlertDialog>
								<AlertDialogTrigger asChild>
									<Button variant="outline" size="sm">Cancel</Button>
								</AlertDialogTrigger>
								<AlertDialogContent>
									<AlertDialogHeader>
										<AlertDialogTitle>Discard changes?</AlertDialogTitle>
										<AlertDialogDescription>
											You have unsaved changes. Are you sure you want to cancel?
										</AlertDialogDescription>
									</AlertDialogHeader>
									<AlertDialogFooter>
										<AlertDialogCancel size="sm">Keep editing</AlertDialogCancel>
										<AlertDialogAction variant="destructive" size="sm" onClick={onCancel}>Discard</AlertDialogAction>
									</AlertDialogFooter>
								</AlertDialogContent>
							</AlertDialog>
						) : (
							<Button variant="outline" onClick={onCancel} size="sm">
								Cancel
							</Button>
						)}

						<AlertDialog>
							<AlertDialogTrigger asChild>
								<Button size='sm' disabled={!hasActiveSubscription || !hasChanges || isSaving || isPublishing}>Save</Button>
							</AlertDialogTrigger>
							<AlertDialogContent>
								<AlertDialogHeader>
									<AlertDialogTitle>Save your changes?</AlertDialogTitle>
									<AlertDialogDescription>
										Your edits will be saved but not yet published.
									</AlertDialogDescription>
								</AlertDialogHeader>
								<AlertDialogFooter>
									<AlertDialogCancel size="sm">Cancel</AlertDialogCancel>
									<AlertDialogAction onClick={onSave} size="sm" >Save</AlertDialogAction>
								</AlertDialogFooter>
							</AlertDialogContent>
						</AlertDialog>
					</>
				)}

				<AlertDialog>
					<AlertDialogTrigger asChild>
						<Button size='sm' disabled={!hasActiveSubscription || isSaving || isPublishing}>{publishAction}</Button>
					</AlertDialogTrigger>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>{publishAction === "Save and Publish"
								? "Confirm save and publish?"
								: "Confirm publish?"}</AlertDialogTitle>
							<AlertDialogDescription>
								{publishAction === "Save and Publish"
									? "Your changes will be saved and immediately published."
									: "Your changes will be published immediately."}
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel size="sm">Cancel</AlertDialogCancel>
							<AlertDialogAction onClick={onPublish} size="sm">{publishAction}</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			</div>
		</div>
	);
};

const ViewHeader = ({ onPause, onEdit, onPublish, }: { onPause: () => void, onEdit: () => void, onPublish: () => void }) => {
	const { tenant, hasActiveSubscription } = useUserDetails()
	const { data, isPausing } = useTopicDetail();
	const isPaused = data!.status == TopicStatus.Paused;
	const isActive = data!.status == TopicStatus.Active || data!.status == TopicStatus.Published;

	const handleCopyLink = () => {
		const url = `${window.location.origin}/${tenant}/feedbacks?topic=${data!.id}`;
		navigator.clipboard.writeText(url);
		toast.success('Feedback link copied!');
	};

	return (
		<>
			{isActive &&
				<>
					<Button variant="outline" onClick={handleCopyLink} size="sm" className="items-center">
						<Link className="size-3" />
						Copy link
					</Button>
					<Button variant="outline" onClick={onPause} size="sm" className="items-center" disabled={!hasActiveSubscription || isPausing}>
						<Pause className="size-3 fill-current" />
						Pause
					</Button>
				</>
			}
			{isPaused &&
				<>
					<Button onClick={onEdit} size="sm" disabled={!hasActiveSubscription}>Edit</Button>
					<Button onClick={onPublish} size="sm" disabled={!hasActiveSubscription}>Publish</Button>
				</>
			}
		</>

	);
};

const Content = () => {
	const { data, isLoading, pauseTopicAction, handleTopicAction, resetData } = useTopicDetail()
	const pathname = usePathname()
	const searchParams = useSearchParams();
	const viewModeParamName = 'mode';
	const isEditParam = searchParams.get(viewModeParamName)?.toLowerCase() === "edit";
	const [isEditMode, setIsEditMode] = useState(false);
	const queryClient = useQueryClient();

	useEffect(() => {
		if (data?.status === TopicStatus.Draft) {
			// Draft → force edit mode
			setIsEditMode(true);
		} else if (data?.status === TopicStatus.Paused) {
			// Paused → allow query param to decide
			setIsEditMode(isEditParam);
		}
	}, [data?.status, isEditParam]);

	if (isLoading) return <Loading />
	if (!data) return <NotFound />

	const { publishAction } = getAvailableActions(data.status)
	const status = statuses[data.status]

	const cancelEdit = () => {
		setIsEditMode(false);
		resetData();
		setQueryParam(pathname, viewModeParamName, 'details');
	}

	const saveTopic = async () => {
		const success = await handleTopicAction('Save');
		if (success) {
			setIsEditMode(false);
			setQueryParam(pathname, viewModeParamName, 'details');
		}
	}

	const pauseTopic = async () => {
		const success = await pauseTopicAction();
		if (success) {
			queryClient.invalidateQueries({
				queryKey: ['topic', data.topicCode],
				exact: true,
			});
			queryClient.invalidateQueries({
				queryKey: ['topic', data.id],
				exact: false,
			});
		}
	}

	const publishTopic = async (publishAction: 'Publish' | 'Save and Publish') => {
		const success = await handleTopicAction(publishAction);
		if (success) {
			queryClient.invalidateQueries({
				queryKey: ['topic', data.topicCode],
				exact: true,
			});
			queryClient.invalidateQueries({
				queryKey: ['topic', data.id],
				exact: false,
			});
			setIsEditMode(false);
			setQueryParam(pathname, viewModeParamName, 'details');
		}
	}

	const editTopic = () => {
		setIsEditMode(true);
		setQueryParam(pathname, 'tab', undefined);
		setQueryParam(pathname, viewModeParamName, 'edit');
	}

	return (
		<div className='pb-2'>
			{/* Header */}
			<div className='sticky top-14 py-2 px-4 flex flex-col lg:flex-row gap-4 bg-background z-50'>
				<div className='flex flex-1 flex-col min-w-0'>
					<div className='flex gap-2 items-center'>
						<span className='text-muted-foreground text-sm'>Topic ID: {data.topicCode}</span>
						<Badge color={status!.color} variant='outline'>{status!.value}</Badge>
					</div>
					<h4 className='text-xl font-semibold truncate'>{data.name}</h4>
				</div>

				{/* Button Group */}
				<div className='flex flex-1 flex-row space-x-2 items-center justify-end'>
					{isEditMode
						? <EditHeader onCancel={cancelEdit} onSave={saveTopic} onPublish={() => publishTopic(publishAction)} />
						: <ViewHeader onPause={pauseTopic} onEdit={editTopic} onPublish={() => publishTopic('Publish')} />}
				</div>
			</div>

			{/* Body */}
			{isEditMode ? <EditMode /> : <DetailsMode />}
		</div>
	);
};

export default function Details({ code }: { code: string }) {

	return (
		<TopicDetailProvider code={code}>
			<Content />
		</TopicDetailProvider>
	)
}
