import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { IconMoodEmpty, IconMoodHappy, IconMoodSad } from "@tabler/icons-react";
import { InfoIcon, TrendingDown, TrendingUp } from "lucide-react";
import { XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, BarChart, Bar, Tooltip as ChartTooltip } from 'recharts'

export type SentimentsStats = {
    distribution: {
        neutral: number;
        negative: number;
        positive: number
    };
    overall_sentiment_score: number
    sentiment_matrix: {
        low: {
            neutral: number;
            negative: number;
            positive: number;
        };
        high: {
            neutral: number;
            negative: number;
            positive: number;
        };
        medium: {
            neutral: number;
            negative: number;
            positive: number;
        };
        explanation: string;
    }
}

export default function SentimentsCards({ stats }: { stats: SentimentsStats }) {

    const { positive, negative, neutral } = stats.distribution;
    const total = positive + negative + neutral;

    const poPercent = Math.round(positive / total * 100)
    const ngPercent = Math.round(negative / total * 100)
    const nuPercent = Math.round(neutral / total  * 100)
    const oPercent = Math.round(stats.overall_sentiment_score * 100)
    const data: any[] = [];
    const { high, low, medium } = stats.sentiment_matrix

    data.push({
        priority: 'High',
        ...high
    })

    data.push({
        priority: 'Medium',
        ...medium
    })

    data.push({
        priority: 'Low',
        ...low
    })

    return (
        <div className="grid lg:grid-cols-2 gap-4">
            <div className="flex flex-col gap-4">
                <Card className="py-4">
                    <CardHeader>
                        <CardDescription className="text-muted-foreground font-semibold">
                            Overall Sentiment
                        </CardDescription>
                        <CardAction className={cn(
                                'text-xl h-16 w-16 font-semibold rounded-md p-2 flex items-center justify-center gap-2', 
                                oPercent < 0 ? 'bg-destructive/30 text-destructive-foreground' : 'bg-success/30 text-success-foreground'
                            )}>
                            {
                                oPercent < 0 ? (<TrendingDown className="size-8" />) : (<TrendingUp className="size-8" />)
                            }
                        </CardAction>
                        <CardTitle>
                            <div className="flex flex-row justify-between">
                                <div 
                                    className={cn(
                                        'text-xl md:text-3xl font-semibold flex flex-col justify-end', 
                                        oPercent < 0 ? 'text-destructive-foreground' : 'text-success-foreground'
                                    )}>
                                    {oPercent}%
                                </div>
                            </div>
                        </CardTitle>
                    </CardHeader>
                </Card>

                <Card className="py-4">
                    <CardHeader>
                        <CardDescription className="text-muted-foreground font-semibold">
                            Analysis
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col space-y-4">
                        <div className="flex flex-1 gap-1">
                            <div className="bg-success h-4 rounded-md" style={{ width: `${poPercent}%`}}></div>
                        
                            <div className="bg-destructive h-4 rounded-md" style={{ width: `${ngPercent}%`}}></div>
                        
                            <div className="bg-warning h-4 rounded-md" style={{ width: `${nuPercent}%`}}></div>
                        </div>
                        
                        <div className="flex gap-8">
                            <div className="flex flex-col gap-2">
                                <span className="text-sm text-muted-foreground">Positive</span>
                                <div className="flex flex-row gap-2 items-center">
                                    <IconMoodHappy className="size-5 text-success-foreground" />
                                    <span className="font-semibold">{positive}</span>
                                </div>
                            </div>
                            
                            <div className="flex flex-col gap-2">
                                <span className="text-sm text-muted-foreground">Negative</span>
                                <div className="flex flex-row gap-2 items-center">
                                    <IconMoodSad className="size-5 text-destructive-foreground" />
                                    <span className="font-semibold">{negative}</span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <span className="text-sm text-muted-foreground">Neutral</span>
                                <div className="flex flex-row gap-2 items-center">
                                    <IconMoodEmpty className="size-5 text-warning-foreground" />
                                    <span className="font-semibold">{neutral}</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardDescription className="text-muted-foreground font-semibold">
                        Sentiment Matrix
                    </CardDescription>
                    <CardAction>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <InfoIcon className="size-4" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-sm">
                                <p>{stats.sentiment_matrix.explanation}</p>
                            </TooltipContent>
                        </Tooltip>
                    </CardAction>
                </CardHeader>
                <CardContent className="flex flex-col flex-1 justify-end">
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="priority" tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 12 }} />
                            <ChartTooltip 
                                contentStyle={{
                                    backgroundColor: '#ffffff',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                }}
                            />
                            <Legend />
                            <Bar dataKey="positive" fill="#9b87f5" name="Positive" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="negative" fill="#D6BCFA" name="Negative" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="neutral" fill="#c0bdd8" name="Neutral" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
            
        </div>
    )
}