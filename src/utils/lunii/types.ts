export type PackMetadata = {
  description: string;
  packType: string;
  ref: string;
  title: string;
  uuid: string;
  installSource?: string;
};

export type StudioStageNode = {
  uuid: string;
  audio?: string;
  image?: string;
  okTransition: {
    actionNode: string;
    optionIndex: number;
  } | null;
  homeTransition: {
    actionNode: string;
    optionIndex: number;
  } | null;
  controlSettings: {
    wheel: boolean;
    ok: boolean;
    home: boolean;
    pause: boolean;
    autoplay: boolean;
  };
};

export type StudioActionNode = {
  id: string;
  options: string[];
};

export type StudioPack = {
  description: string;
  title: string;
  uuid: string;
  version: number;
  stageNodes: StudioStageNode[];
  actionNodes: StudioActionNode[];
};
