import * as React from "react";
import { cn } from "../../lib/utils";

type DivProps = React.ComponentProps<"div">;

export const Card = React.forwardRef<HTMLDivElement, DivProps>(function Card(
  { className, ...props }, ref,
) {
  return <div ref={ref} className={cn("av-card", className)} {...props} />;
});

export const CardHeader = React.forwardRef<HTMLDivElement, DivProps>(function CardHeader(
  { className, ...props }, ref,
) {
  return <div ref={ref} className={cn("av-card-header", className)} {...props} />;
});

export const CardTitle = React.forwardRef<HTMLDivElement, DivProps>(function CardTitle(
  { className, ...props }, ref,
) {
  return <div ref={ref} className={cn("av-card-title", className)} {...props} />;
});

export const CardDescription = React.forwardRef<HTMLDivElement, DivProps>(function CardDescription(
  { className, ...props }, ref,
) {
  return <div ref={ref} className={cn("av-card-description", className)} {...props} />;
});

export const CardContent = React.forwardRef<HTMLDivElement, DivProps>(function CardContent(
  { className, ...props }, ref,
) {
  return <div ref={ref} className={cn("av-card-content", className)} {...props} />;
});

export const CardFooter = React.forwardRef<HTMLDivElement, DivProps>(function CardFooter(
  { className, ...props }, ref,
) {
  return <div ref={ref} className={cn("av-card-footer", className)} {...props} />;
});
