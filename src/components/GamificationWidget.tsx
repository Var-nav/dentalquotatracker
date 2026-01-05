import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Flame, Trophy, Award } from "lucide-react";
import { useGamification } from "@/hooks/useGamification";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export const GamificationWidget = () => {
  const { userStats, userBadges, allBadges } = useGamification();

  const earnedBadgeIds = new Set(userBadges.map((ub) => ub.badge_id));
  const unearnedBadges = allBadges.filter((badge) => !earnedBadgeIds.has(badge.id));

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Streak Card */}
      <Card className="border border-warning/20 bg-gradient-to-br from-card via-warning/5 to-card shadow-soft transition-all duration-300 hover:shadow-lg">
        <CardHeader className="flex flex-row items-center gap-3 pb-4">
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-warning to-orange-500 flex items-center justify-center shadow-lg">
            <Flame className="h-6 w-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-lg">Current Streak</CardTitle>
            <p className="text-sm text-muted-foreground">Keep logging daily!</p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-5xl font-bold text-warning mb-1">
                {userStats?.current_streak || 0}
              </div>
              <p className="text-sm text-muted-foreground">days in a row</p>
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-border/50">
              <div className="text-center">
                <div className="text-2xl font-semibold text-foreground">
                  {userStats?.longest_streak || 0}
                </div>
                <p className="text-xs text-muted-foreground">Best Streak</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold text-foreground">
                  {userStats?.total_procedures || 0}
                </div>
                <p className="text-xs text-muted-foreground">Total Cases</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Badges Card */}
      <Card className="border border-primary/20 bg-gradient-to-br from-card via-primary/5 to-card shadow-soft transition-all duration-300 hover:shadow-lg">
        <CardHeader className="flex flex-row items-center gap-3 pb-4">
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg">
            <Trophy className="h-6 w-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-lg">Achievements</CardTitle>
            <p className="text-sm text-muted-foreground">
              {userBadges.length} of {allBadges.length} earned
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <TooltipProvider>
            <div className="grid grid-cols-3 gap-3">
              {/* Earned Badges */}
              {userBadges.map((userBadge) => (
                <Tooltip key={userBadge.id}>
                  <TooltipTrigger asChild>
                    <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20 cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-md">
                      <div className="text-3xl">{userBadge.badge?.icon}</div>
                      <Badge variant="secondary" className="text-xs px-2 py-0.5">
                        {userBadge.badge?.name}
                      </Badge>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-center">
                      <p className="font-semibold">{userBadge.badge?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {userBadge.badge?.description}
                      </p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              ))}

              {/* Locked Badges */}
              {unearnedBadges.slice(0, 6 - userBadges.length).map((badge) => (
                <Tooltip key={badge.id}>
                  <TooltipTrigger asChild>
                    <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-muted/30 border border-border/30 cursor-pointer transition-all duration-200 hover:scale-105 opacity-50 grayscale">
                      <div className="text-3xl">{badge.icon}</div>
                      <Badge variant="outline" className="text-xs px-2 py-0.5">
                        <Award className="h-3 w-3 mr-1" />
                        Locked
                      </Badge>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-center">
                      <p className="font-semibold">{badge.name}</p>
                      <p className="text-xs text-muted-foreground">{badge.description}</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </TooltipProvider>
        </CardContent>
      </Card>
    </div>
  );
};
