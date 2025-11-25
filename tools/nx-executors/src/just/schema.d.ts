export interface JustExecutorSchema {
	tasks: string[];

	args?: string[];

	set?: Record<string, string>;
	setOverride?: Record<string, string>;

	env?: Record<string, string>;

	justfile?: string;
	workingDirectory?: string;
	noWorkingDirectory?: boolean;

	dotenvFilename?: string;
	dotenvPath?: string;
	dotenvOverride?: boolean;
	noDotenv?: boolean;

	dryRun?: boolean;

	jobs?: number;
	choose?: boolean;
	check?: boolean;
	unsorted?: boolean;
	summary?: boolean;

	quiet?: boolean;
	verbose?: boolean;

	color?: 'auto' | 'always' | 'never';
}
